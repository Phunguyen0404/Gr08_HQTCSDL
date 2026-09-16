/* Chuyển đổi ngày sang Date. */
function normalizeDate(dateValue) {
    if (!dateValue) {
        throw new Error('Ngày không hợp lệ.');
    }

    const date = new Date(`${dateValue}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Ngày không hợp lệ: ${dateValue}`);
    }

    return date;
}

/* Kiểm tra 2 khoảng thời gian có chồng nhau không. */
function hasOverlap(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
}

/* Chuẩn hóa trạng thái phòng để hỗ trợ cả "available" và "Trống". */
function normalizeRoomStatus(status) {
    if (typeof status !== 'string') {
        return '';
    }

    return status.trim().toLowerCase();
}

/* Kiểm tra phòng có trống trong khoảng thời gian không. */
function isRoomAvailable(room, bookings = [], checkIn, checkOut) {
    if (!room) {
        return false;
    }

    const roomStatus = normalizeRoomStatus(room.status);
    const availableStatuses = new Set(['available', 'trống', 'trong', 'vacant', 'free']);

    if (roomStatus && !availableStatuses.has(roomStatus)) {
        return false;
    }

    if (!checkIn || !checkOut) {
        return false;
    }

    const start = normalizeDate(checkIn);
    const end = normalizeDate(checkOut);

    if (end <= start) {
        throw new Error('checkOut phải lớn hơn checkIn.');
    }

    const hasBookingConflict = bookings.some((booking) => {
        if (Number(booking.roomId) !== Number(room.id)) {
            return false;
        }

        const bookingStart = normalizeDate(booking.checkIn);
        const bookingEnd = normalizeDate(booking.checkOut);
        return hasOverlap(start, end, bookingStart, bookingEnd);
    });

    return !hasBookingConflict;
}

/* Lấy danh sách phòng trống theo ngày. */
function getAvailableRooms(rooms = [], bookings = [], checkIn, checkOut) {
    return rooms.filter((room) => isRoomAvailable(room, bookings, checkIn, checkOut));
}

module.exports = {
    normalizeDate,
    hasOverlap,
    isRoomAvailable,
    getAvailableRooms
};
