const Booking = require('../models/Booking');

function isValidDate(value) {
    return !Number.isNaN(new Date(value).getTime());
}

async function findAvailableRooms({ checkIn, checkOut, guests }) {
    if (!checkIn || !checkOut || !isValidDate(checkIn) || !isValidDate(checkOut)) {
        const error = new Error('Ngày nhận / trả phòng không hợp lệ');
        error.status = 400;
        throw error;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
        const error = new Error('Ngày nhận phòng phải trước ngày trả phòng');
        error.status = 400;
        throw error;
    }

    const guestCount = Number(guests) || 1;
    return Booking.searchAvailableRooms(checkIn, checkOut, guestCount);
}

async function createBooking(payload) {
    const { customerId, checkIn, checkOut, guests, rooms } = payload;

    if (!customerId) {
        const error = new Error('Thiếu mã khách hàng');
        error.status = 400;
        throw error;
    }
    if (!checkIn || !checkOut || !isValidDate(checkIn) || !isValidDate(checkOut)) {
        const error = new Error('Ngày nhận / trả phòng không hợp lệ');
        error.status = 400;
        throw error;
    }
    if (!Array.isArray(rooms) || rooms.length === 0) {
        const error = new Error('Vui lòng chọn ít nhất một phòng');
        error.status = 400;
        throw error;
    }

    const result = await Booking.createBooking({
        customerId,
        staffId: payload.staffId,
        checkIn,
        checkOut,
        guests: Number(guests) || 1,
        deposit: payload.deposit,
        note: payload.note,
        rooms
    });

    if (result.result !== 'OK') {
        const error = new Error(result.result);
        error.status = 409;
        throw error;
    }

    return result;
}

async function listBookings(customerId) {
    return Booking.getBookings({ customerId });
}

async function getBooking(bookingId) {
    const booking = await Booking.getBookingById(bookingId);
    if (!booking) {
        const error = new Error('Không tìm thấy đơn đặt phòng');
        error.status = 404;
        throw error;
    }
    return booking;
}

async function cancelBooking(bookingId, customerId) {
    if (!customerId) {
        const error = new Error('Thiếu mã khách hàng');
        error.status = 400;
        throw error;
    }

    try {
        const cancelled = await Booking.cancelBooking(bookingId, customerId);
        if (!cancelled) {
            const error = new Error('Không tìm thấy đơn đặt phòng của khách hàng này');
            error.status = 404;
            throw error;
        }
        return true;
    } catch (err) {
        if (err.sqlState === '45000') {
            const error = new Error(err.sqlMessage);
            error.status = 409;
            throw error;
        }
        throw err;
    }
}

module.exports = {
    findAvailableRooms,
    createBooking,
    listBookings,
    getBooking,
    cancelBooking
};