const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Booking = require('../models/Booking');

/** Gửi phản hồi lỗi chuẩn cho client. */
function sendError(res, statusCode, message) {
    return res.status(statusCode).json({ success: false, message });
}

/** Lấy danh sách tất cả loại phòng. */
async function listRoomTypes(req, res) {
    try {
        const types = await RoomType.getAll();
        return res.json({ success: true, data: types });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/** Tạo mới một loại phòng. */
async function createRoomType(req, res) {
    const { name, description, price, capacity } = req.body || {};

    if (!name) {
        return sendError(res, 400, 'Tên loại phòng là bắt buộc.');
    }

    try {
        const roomType = await RoomType.create({ name, description, price, capacity });
        return res.status(201).json({ success: true, data: roomType });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/** Cập nhật thông tin loại phòng theo id. */
async function updateRoomType(req, res) {
    const { id } = req.params;
    try {
        const roomType = await RoomType.update(id, req.body || {});
        if (!roomType) {
            return sendError(res, 404, 'Không tìm thấy loại phòng.');
        }
        return res.json({ success: true, data: roomType });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/** Xóa loại phòng theo id. */
async function deleteRoomType(req, res) {
    const { id } = req.params;
    try {
        const removed = await RoomType.remove(id);
        if (!removed) {
            return sendError(res, 404, 'Không tìm thấy loại phòng.');
        }
        return res.json({ success: true, message: 'Xóa loại phòng thành công.' });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/** Lấy toàn bộ danh sách phòng. */
async function listRooms(req, res) {
    try {
        const rooms = await Room.getAll();
        return res.json({ success: true, data: rooms });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/** Lấy thông tin chi tiết một phòng theo id. */
async function getRoomById(req, res) {
    try {
        const room = await Room.getById(req.params.id);
        if (!room) {
            return sendError(res, 404, 'Không tìm thấy phòng.');
        }
        return res.json({ success: true, data: room });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/** Tạo mới một phòng. */
async function createRoom(req, res) {
    const { code, name, roomTypeId, roomType, price, capacity, status, note, roomNumber, floor } = req.body || {};

    if (!code && !roomNumber && !name) {
        return sendError(res, 400, 'Mã phòng hoặc số phòng là bắt buộc.');
    }

    try {
        const room = await Room.create({
            code,
            name,
            roomNumber,
            roomTypeId,
            roomType,
            price,
            capacity,
            status,
            floor,
            note
        });

        return res.status(201).json({ success: true, data: room });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/** Cập nhật thông tin phòng theo id. */
async function updateRoom(req, res) {
    const { id } = req.params;
    try {
        const room = await Room.update(id, req.body || {});
        if (!room) {
            return sendError(res, 404, 'Không tìm thấy phòng.');
        }
        return res.json({ success: true, data: room });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/** Xóa phòng theo id. */
async function deleteRoom(req, res) {
    const { id } = req.params;
    try {
        const removed = await Room.remove(id);
        if (!removed) {
            return sendError(res, 404, 'Không tìm thấy phòng.');
        }
        return res.json({ success: true, message: 'Xóa phòng thành công.' });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
}

/** Trả về danh sách phòng còn trống từ MySQL trong khoảng ngày được yêu cầu. */
async function getAvailableRoomsRoute(req, res) {
    try {
        const { checkIn, checkOut, guests } = req.query;
        if (!checkIn || !checkOut) {
            return sendError(res, 400, 'Vui lòng truyền checkIn và checkOut.');
        }

        const rooms = await Booking.searchAvailableRooms(checkIn, checkOut, Number(guests) || 1);
        const formatted = rooms.map(r => ({
            id: r.MaPhong,
            code: r.MaPhong,
            name: `Phòng ${r.SoPhong}`,
            roomNumber: r.SoPhong,
            roomType: r.TenLoaiPhong,
            roomTypeId: r.MaLoaiPhong,
            price: Number(r.GiaCoBan),
            capacity: Number(r.SucChua),
            floor: Number(r.Tang),
            status: 'Trống',
            statusCode: 'AVAILABLE',
            note: r.MoTa || ''
        }));

        return res.json({ success: true, data: formatted });
    } catch (error) {
        return sendError(res, 400, error.message);
    }
}

/** Kiểm tra phòng cụ thể có còn trống trong khoảng thời gian không. */
async function checkRoomAvailability(req, res) {
    try {
        const { roomId, checkIn, checkOut } = req.query;
        if (!roomId || !checkIn || !checkOut) {
            return sendError(res, 400, 'Thiếu thông tin phòng hoặc ngày.');
        }

        const room = await Room.getById(roomId);
        if (!room) {
            return sendError(res, 404, 'Không tìm thấy phòng.');
        }

        const availableRooms = await Booking.searchAvailableRooms(checkIn, checkOut, 1);
        const isAvailable = availableRooms.some(r => r.MaPhong === room.code || r.SoPhong === room.roomNumber);

        return res.json({
            success: true,
            data: {
                roomId: room.id,
                roomCode: room.code,
                available: isAvailable,
                checkIn,
                checkOut
            }
        });
    } catch (error) {
        return sendError(res, 400, error.message);
    }
}

module.exports = {
    listRoomTypes,
    createRoomType,
    updateRoomType,
    deleteRoomType,
    listRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    getAvailableRoomsRoute,
    checkRoomAvailability
};
