const bookingService = require('../services/bookingService');

function sendError(res, err) {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        data: null,
        message: status === 500 ? 'Lỗi server' : err.message
    });
}

async function getAvailableRooms(req, res) {
    try {
        const { checkIn, checkOut, guests } = req.query;
        const rooms = await bookingService.findAvailableRooms({ checkIn, checkOut, guests });
        res.status(200).json({ success: true, data: rooms, message: 'Lấy danh sách phòng trống thành công' });
    } catch (err) {
        sendError(res, err);
    }
}

async function createBooking(req, res) {
    try {
        const result = await bookingService.createBooking(req.body);
        res.status(201).json({ success: true, data: result, message: 'Đặt phòng thành công' });
    } catch (err) {
        sendError(res, err);
    }
}

async function listBookings(req, res) {
    try {
        const bookings = await bookingService.listBookings(req.query.customerId);
        res.status(200).json({ success: true, data: bookings, message: 'Lấy danh sách đặt phòng thành công' });
    } catch (err) {
        sendError(res, err);
    }
}

async function getBooking(req, res) {
    try {
        const booking = await bookingService.getBooking(req.params.id);
        res.status(200).json({ success: true, data: booking, message: 'Lấy chi tiết đặt phòng thành công' });
    } catch (err) {
        sendError(res, err);
    }
}

async function cancelBooking(req, res) {
    try {
        await bookingService.cancelBooking(req.params.id, req.body.customerId);
        res.status(200).json({ success: true, data: null, message: 'Hủy đặt phòng thành công' });
    } catch (err) {
        sendError(res, err);
    }
}

module.exports = {
    getAvailableRooms,
    createBooking,
    listBookings,
    getBooking,
    cancelBooking
};