const test = require('node:test');
const assert = require('node:assert/strict');

const { isRoomAvailable, getAvailableRooms } = require('../services/roomService');

// Test: phòng còn trống khi không có booking chồng lịch.
test('phòng còn trống khi không có booking chồng lịch', () => {
    const room = { id: 1, status: 'available' };
    const bookings = [
        { roomId: 1, checkIn: '2026-08-20', checkOut: '2026-08-22' }
    ];

    assert.equal(isRoomAvailable(room, bookings, '2026-08-22', '2026-08-24'), true);
});

// Test: phòng không còn trống khi booking chồng lịch.
test('phòng không còn trống khi booking chồng lịch', () => {
    const room = { id: 1, status: 'available' };
    const bookings = [
        { roomId: 1, checkIn: '2026-08-20', checkOut: '2026-08-24' }
    ];

    assert.equal(isRoomAvailable(room, bookings, '2026-08-22', '2026-08-25'), false);
});

// Test: chỉ trả về các phòng còn trống, loại bỏ phòng bị chồng lịch.
test('hỉ trả về các phòng còn trống, loại bỏ phòng bị chồng lịchp', () => {
    const rooms = [
        { id: 1, status: 'available' },
        { id: 2, status: 'available' },
        { id: 3, status: 'occupied' }
    ];
    const bookings = [
        { roomId: 1, checkIn: '2026-08-20', checkOut: '2026-08-24' }
    ];

    const result = getAvailableRooms(rooms, bookings, '2026-08-22', '2026-08-25');
    assert.deepEqual(result.map(room => room.id), [2]);
});

// Test: trạng thái phòng có thể là "Trống" hoặc "AVAILABLE" tùy hệ thống.
test('phòng vẫn được xem là trống khi trạng thái là Trống hoặc AVAILABLE', () => {
    const roomVi = { id: 10, status: 'Trống' };
    const roomEn = { id: 11, status: 'AVAILABLE' };
    const bookings = [];

    assert.equal(isRoomAvailable(roomVi, bookings, '2026-09-10', '2026-09-12'), true);
    assert.equal(isRoomAvailable(roomEn, bookings, '2026-09-10', '2026-09-12'), true);
});
