const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const {
    isRoomAvailable,
    getAvailableRooms,
    normalizeDate
} = require('../services/roomService');

/** Gửi phản hồi lỗi chuẩn cho client. 
 * @param {object} res - Response Express 
 * @param {number} statusCode 
 * - Mã HTTP @param {string} message 
 * - Thông báo lỗi 
 * */
function sendError(res, statusCode, message) {
    return res.status(statusCode).json({ success: false, message });
}

/** Lấy danh sách tất cả loại phòng. */
function listRoomTypes(req, res) {
    return res.json({ success: true, data: RoomType.getAll() });
}

/** Tạo mới một loại phòng. */
function createRoomType(req, res) {
    const { name, description, price, capacity } = req.body || {};

    if (!name) {
        return sendError(res, 400, 'Tên loại phòng là bắt buộc.');
    }

    const roomType = RoomType.create({ name, description, price, capacity });
    return res.status(201).json({ success: true, data: roomType });
}

/** Cập nhật thông tin loại phòng theo id. */
function updateRoomType(req, res) {
    const { id } = req.params;
    const roomType = RoomType.update(id, req.body || {});

    if (!roomType) {
        return sendError(res, 404, 'Không tìm thấy loại phòng.');
    }

    return res.json({ success: true, data: roomType });
}

/** Xóa loại phòng theo id. */
function deleteRoomType(req, res) {
    const { id } = req.params;
    const removed = RoomType.remove(id);

    if (!removed) {
        return sendError(res, 404, 'Không tìm thấy loại phòng.');
    }

    return res.json({ success: true, message: 'Xóa loại phòng thành công.' });
}

/** Lấy toàn bộ danh sách phòng. */
function listRooms(req, res) {
    return res.json({ success: true, data: Room.getAll() });
}

/** Lấy thông tin chi tiết một phòng theo id. */
function getRoomById(req, res) {
    const room = Room.getById(req.params.id);
    if (!room) {
        return sendError(res, 404, 'Không tìm thấy phòng.');
    }

    return res.json({ success: true, data: room });
}

/** Tạo mới một phòng. */
function createRoom(req, res) {
    const { code, name, roomTypeId, roomType, price, capacity, status, note } = req.body || {};

    if (!code || !name) {
        return sendError(res, 400, 'Mã phòng và tên phòng là bắt buộc.');
    }

    const room = Room.create({
        code,
        name,
        roomTypeId,
        roomType,
        price,
        capacity,
        status,
        note
    });

    return res.status(201).json({ success: true, data: room });
}

/** Cập nhật thông tin phòng theo id. */
function updateRoom(req, res) {
    const { id } = req.params;
    const room = Room.update(id, req.body || {});

    if (!room) {
        return sendError(res, 404, 'Không tìm thấy phòng.');
    }

    return res.json({ success: true, data: room });
}

/* Xóa phòng theo id.*/
function deleteRoom(req, res) {
    const { id } = req.params;
    const removed = Room.remove(id);

    if (!removed) {
        return sendError(res, 404, 'Không tìm thấy phòng.');
    }

    return res.json({ success: true, message: 'Xóa phòng thành công.' });
}

/** Trả về danh sách phòng còn trống trong khoảng ngày được yêu cầu. */
function getAvailableRoomsRoute(req, res) {
    try {
        const { checkIn, checkOut } = req.query;
        if (!checkIn || !checkOut) {
            return sendError(res, 400, 'Vui lòng truyền checkIn và checkOut.');
        }

        const rooms = Room.getAll();
        const { store } = require('../config/db');
        const bookings = store.bookings || [];
        const result = getAvailableRooms(rooms, bookings, checkIn, checkOut);

        return res.json({ success: true, data: result });
    } catch (error) {
        return sendError(res, 400, error.message);
    }
}

/** Kiểm tra phòng cụ thể có còn trống trong khoảng thời gian không. */
function checkRoomAvailability(req, res) {
    try {
        const { roomId, checkIn, checkOut } = req.query;
        const room = Room.getById(roomId);

        if (!room) {
            return sendError(res, 404, 'Không tìm thấy phòng.');
        }

        const { store } = require('../config/db');
        const available = isRoomAvailable(room, store.bookings || [], checkIn, checkOut);

        return res.json({
            success: true,
            data: {
                roomId: room.id,
                roomCode: room.code,
                available,
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
