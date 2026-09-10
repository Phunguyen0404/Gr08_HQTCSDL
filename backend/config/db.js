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