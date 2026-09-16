const Booking = require('../models/Booking');

function isValidDate(value) {
    return !Number.isNaN(new Date(value).getTime());
}

function isRetryableTransactionError(error) {
    return error?.code === 'ER_LOCK_DEADLOCK' || error?.code === 'ER_LOCK_WAIT_TIMEOUT' ||
        /LOI SQL \[(1213|1205)\]/.test(error?.message || '');
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

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
    const customerId = payload.customerId || payload.maKH;
    const checkIn = payload.checkIn || payload.checkInDate || payload.ngayNhanDuKien;
    const checkOut = payload.checkOut || payload.checkOutDate || payload.ngayTraDuKien;
    const guests = payload.guests || payload.soNguoiDuKien || 1;
    const rooms = payload.rooms || payload.danhSachPhong || [];

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

    const bookingData = {
        customerId,
        staffId: payload.staffId,
        checkIn,
        checkOut,
        guests: Number(guests) || 1,
        deposit: payload.deposit || payload.tienCoc,
        note: payload.note || payload.ghiChu,
        rooms
    };

    let result;
    let lastError;
    // InnoDB may abort one transaction to break a deadlock. Retry the whole
    // procedure only after its transaction has already been rolled back.
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            result = await Booking.createBooking(bookingData);
            if (result.result === 'OK' || !/LOI SQL \[(1213|1205)\]/.test(result.result || '')) break;
            lastError = Object.assign(new Error(result.result), { code: 'ER_LOCK_DEADLOCK' });
        } catch (error) {
            lastError = error;
            if (!isRetryableTransactionError(error)) throw error;
        }
        if (attempt < 2) await wait(80 * (attempt + 1));
    }

    if (!result || (lastError && result.result !== 'OK')) {
        const error = new Error('Dữ liệu đang được người dùng khác xử lý. Vui lòng thử lại.');
        error.status = 409;
        throw error;
    }

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
    try {
        const cancelled = await Booking.cancelBooking(bookingId, customerId);
        if (!cancelled) {
            const error = new Error('Đơn đã được thay đổi hoặc không còn ở trạng thái chờ. Vui lòng tải lại dữ liệu trước khi hủy.');
            error.status = 409;
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

async function checkIn(bookingId, staffId) {
    return Booking.checkInBooking(bookingId, staffId);
}

async function checkOut(bookingId, staffId) {
    return Booking.checkOutBooking(bookingId, staffId);
}

module.exports = {
    findAvailableRooms,
    createBooking,
    listBookings,
    getBooking,
    cancelBooking,
    checkIn,
    checkOut
};
