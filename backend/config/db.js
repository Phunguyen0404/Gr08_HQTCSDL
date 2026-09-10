const mysql = require('mysql2/promise');

console.log('>>> DB.JS DANG DUOC LOAD <<<');

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'DA CO' : 'DANG TRONG');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const store = {
    roomTypes: [
        { id: 1, name: 'Standard', description: 'Phòng tiêu chuẩn', price: 900000, capacity: 2 },
        { id: 2, name: 'Deluxe', description: 'Phòng Deluxe', price: 1400000, capacity: 2 },
        { id: 3, name: 'Family', description: 'Phòng gia đình', price: 1800000, capacity: 4 },
        { id: 4, name: 'Suite', description: 'Phòng Suite', price: 2600000, capacity: 4 }
    ],
    rooms: [
        { id: 1, code: 'P101', name: 'Phòng Standard 101', roomTypeId: 1, roomType: 'Standard', price: 900000, capacity: 2, status: 'Trống', note: 'Gần thang máy' },
        { id: 2, code: 'P102', name: 'Phòng Standard 102', roomTypeId: 1, roomType: 'Standard', price: 900000, capacity: 2, status: 'Đang thuê', note: 'Đã có khách' },
        { id: 3, code: 'P201', name: 'Phòng Deluxe 201', roomTypeId: 2, roomType: 'Deluxe', price: 1400000, capacity: 2, status: 'Trống', note: 'View thành phố' },
        { id: 4, code: 'P202', name: 'Phòng Deluxe 202', roomTypeId: 2, roomType: 'Deluxe', price: 1400000, capacity: 2, status: 'Trống', note: 'View hồ bơi' },
        { id: 5, code: 'P301', name: 'Phòng Family 301', roomTypeId: 3, roomType: 'Family', price: 1800000, capacity: 4, status: 'Trống', note: 'Phù hợp gia đình' },
        { id: 6, code: 'P302', name: 'Phòng Family 302', roomTypeId: 3, roomType: 'Family', price: 1800000, capacity: 4, status: 'Bảo trì', note: 'Đang vệ sinh' },
        { id: 7, code: 'P401', name: 'Phòng Suite 401', roomTypeId: 4, roomType: 'Suite', price: 2600000, capacity: 4, status: 'Trống', note: 'Suite cao cấp' },
        { id: 8, code: 'P402', name: 'Phòng Suite 402', roomTypeId: 4, roomType: 'Suite', price: 2600000, capacity: 4, status: 'Đặt trước', note: 'Đã đặt trước' }
    ],
    bookings: [
        { id: 1, roomId: 2, checkIn: '2026-09-10', checkOut: '2026-09-12' },
        { id: 2, roomId: 8, checkIn: '2026-09-11', checkOut: '2026-09-13' }
    ]
};

pool.store = store;

pool.getConnection()
    .then(connection => {
        console.log('MYSQL: KET NOI THANH CONG');
        connection.release();
    })
    .catch(error => {
        console.log('MYSQL: KET NOI THAT BAI');
        console.log(error.message);
    });

module.exports = pool;
module.exports.store = store;