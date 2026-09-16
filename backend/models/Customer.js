const pool = require('../config/db');

async function generateNextMaKH(conn) {
    const [[row]] = await conn.query(
        `SELECT IFNULL(MAX(CAST(SUBSTRING(MaKH, 3) AS UNSIGNED)), 0) + 1 AS nextId
           FROM KHACH_HANG`
    );
    return 'KH' + String(row.nextId).padStart(3, '0');
}

async function search({ cccd, phone }) {
    const conditions = [];
    const params = [];

    if (cccd) {
        conditions.push('CCCD LIKE ?');
        params.push(`%${cccd}%`);
    }
    if (phone) {
        conditions.push('SoDienThoai LIKE ?');
        params.push(`%${phone}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' OR ')}` : '';
    const [rows] = await pool.query(
        `SELECT MaKH, CCCD, HoTen, NgaySinh, GioiTinh, SoDienThoai, Email, DiaChi, QuocTich
           FROM KHACH_HANG
           ${where}
          ORDER BY NgayTao DESC
          LIMIT 20`,
        params
    );
    return rows;
}

async function getById(maKH) {
    const [[row]] = await pool.query(
        `SELECT MaKH, CCCD, HoTen, NgaySinh, GioiTinh, SoDienThoai, Email, DiaChi, QuocTich, MaTaiKhoan
           FROM KHACH_HANG
          WHERE MaKH = ?`,
        [maKH]
    );
    return row || null;
}

/** Tìm hồ sơ khách hàng đã liên kết với một tài khoản đăng nhập. */
async function getByMaTaiKhoan(maTaiKhoan) {
    const [[row]] = await pool.query(
        `SELECT MaKH, CCCD, HoTen, NgaySinh, GioiTinh, SoDienThoai, Email, DiaChi, QuocTich, MaTaiKhoan
           FROM KHACH_HANG
          WHERE MaTaiKhoan = ?`,
        [maTaiKhoan]
    );
    return row || null;
}

/** Tìm hồ sơ khách hàng theo đúng số CCCD (dùng để kiểm tra trùng khi tạo hồ sơ mới). */
async function getByCCCD(cccd) {
    const [[row]] = await pool.query(
        `SELECT MaKH, CCCD, HoTen, NgaySinh, GioiTinh, SoDienThoai, Email, DiaChi, QuocTich, MaTaiKhoan
           FROM KHACH_HANG
          WHERE CCCD = ?`,
        [cccd]
    );
    return row || null;
}

/** Gắn một hồ sơ khách hàng sẵn có (chưa thuộc tài khoản nào) vào tài khoản đang
 *  đăng nhập, đồng thời cập nhật các thông tin khác mà khách vừa điền lại. */
async function linkToAccount(maKH, maTaiKhoan, data) {
    await pool.query(
        `UPDATE KHACH_HANG
            SET MaTaiKhoan = ?, HoTen = ?, SoDienThoai = ?, Email = ?, DiaChi = ?, NgaySinh = ?, GioiTinh = ?
          WHERE MaKH = ?`,
        [
            maTaiKhoan,
            data.hoTen,
            data.soDienThoai,
            data.email || null,
            data.diaChi || null,
            data.ngaySinh || null,
            data.gioiTinh || null,
            maKH
        ]
    );
    return getById(maKH);
}

async function create(data) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const maKH = await generateNextMaKH(conn);

        await conn.query(
            `INSERT INTO KHACH_HANG
                (MaKH, MaTaiKhoan, CCCD, HoTen, SoDienThoai, Email, DiaChi, NgaySinh, GioiTinh)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                maKH,
                data.maTaiKhoan || null,
                data.cccd,
                data.hoTen,
                data.soDienThoai,
                data.email || null,
                data.diaChi || null,
                data.ngaySinh || null,
                data.gioiTinh || null
            ]
        );

        await conn.commit();
        return getById(maKH);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/** Cập nhật hồ sơ khách hàng đã tồn tại (dùng khi khách hàng cập nhật lại thông tin của mình). */
async function update(maKH, data) {
    await pool.query(
        `UPDATE KHACH_HANG
            SET HoTen = ?, SoDienThoai = ?, Email = ?, DiaChi = ?, NgaySinh = ?, GioiTinh = ?
          WHERE MaKH = ?`,
        [
            data.hoTen,
            data.soDienThoai,
            data.email || null,
            data.diaChi || null,
            data.ngaySinh || null,
            data.gioiTinh || null,
            maKH
        ]
    );
    return getById(maKH);
}

module.exports = {
    search,
    getById,
    getByMaTaiKhoan,
    getByCCCD,
    linkToAccount,
    create,
    update
};