const pool = require('../config/db');

async function findByUsername(username) {
    const [rows] = await pool.execute(
        `SELECT MaTaiKhoan, TenDangNhap, MatKhauHash, VaiTro, TrangThai
         FROM TAI_KHOAN
         WHERE TenDangNhap = ?
         LIMIT 1`,
        [username]
    );

    return rows[0] || null;
}

async function generateAccountId() {
    const [rows] = await pool.execute(
        `SELECT MAX(CAST(SUBSTRING(MaTaiKhoan, 3) AS UNSIGNED)) AS maxSequence
         FROM TAI_KHOAN
         WHERE MaTaiKhoan REGEXP '^TK[0-9]{3}$'`
    );

    const maxSequence = rows[0].maxSequence;
    const nextSequence = maxSequence === null ? 1 : Number(maxSequence) + 1;

    if (nextSequence > 999) {
        throw new RangeError('Da vuot qua gioi han MaTaiKhoan TK999.');
    }

    return `TK${String(nextSequence).padStart(3, '0')}`;
}

async function createAccount({ maTaiKhoan, username, passwordHash, role, status }) {
    const [result] = await pool.execute(
        `INSERT INTO TAI_KHOAN
            (MaTaiKhoan, TenDangNhap, MatKhauHash, VaiTro, TrangThai)
         VALUES (?, ?, ?, ?, ?)`,
        [maTaiKhoan, username, passwordHash, role, status]
    );

    return result;
}

async function getOrCreateCustomerForAccount(maTaiKhoan, username, hoTen, soDienThoai) {
    const [rows] = await pool.query(
        `SELECT MaKH, HoTen, SoDienThoai, CCCD, Email
           FROM KHACH_HANG
          WHERE MaTaiKhoan = ?
          LIMIT 1`,
        [maTaiKhoan]
    );

    if (rows.length > 0) {
        return rows[0];
    }

    const [[maxRow]] = await pool.query(
        `SELECT IFNULL(MAX(CAST(SUBSTRING(MaKH, 3) AS UNSIGNED)), 0) + 1 AS nextId
           FROM KHACH_HANG`
    );
    const maKH = 'KH' + String(maxRow.nextId).padStart(3, '0');
    const customerName = hoTen || username;
    const phone = soDienThoai || `090${String(maxRow.nextId).padStart(7, '0')}`;
    const cccd = `001203${String(maxRow.nextId).padStart(6, '0')}`;

    await pool.query(
        `INSERT INTO KHACH_HANG
            (MaKH, MaTaiKhoan, CCCD, HoTen, SoDienThoai, Email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [maKH, maTaiKhoan, cccd, customerName, phone, `${username}@customer.hotel.vn`]
    );

    return { MaKH: maKH, HoTen: customerName, SoDienThoai: phone, CCCD: cccd };
}

module.exports = {
    findByUsername,
    generateAccountId,
    createAccount,
    getOrCreateCustomerForAccount
};
