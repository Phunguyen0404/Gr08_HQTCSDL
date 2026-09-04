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

module.exports = {
    findByUsername,
    generateAccountId,
    createAccount
};
