const pool = require('../config/db');

async function searchAvailableRooms(checkIn, checkOut, guests) {
    const [rows] = await pool.query(
        `SELECT p.MaPhong, p.SoPhong, p.Tang,
                lp.MaLoaiPhong, lp.TenLoaiPhong, lp.MoTa, lp.SucChua, lp.GiaCoBan
           FROM PHONG p
           JOIN LOAI_PHONG lp ON lp.MaLoaiPhong = p.MaLoaiPhong
          WHERE lp.TrangThai = 'ACTIVE'
            AND p.TrangThai NOT IN ('OUT_OF_SERVICE', 'MAINTENANCE')
            AND lp.SucChua >= ?
            AND p.MaPhong NOT IN (
                SELECT ctp.MaPhong
                  FROM CHI_TIET_DAT_PHONG ctp
                  JOIN DAT_PHONG dp ON dp.MaDatPhong = ctp.MaDatPhong
                 WHERE dp.TrangThai NOT IN ('CANCELLED', 'NO_SHOW')
                   AND dp.NgayNhanDuKien < ?
                   AND dp.NgayTraDuKien > ?
            )
          ORDER BY lp.GiaCoBan ASC, p.MaPhong ASC`,
        [guests, checkOut, checkIn]
    );
    return rows;
}

async function createBooking(data) {
    const conn = await pool.getConnection();
    try {
        await conn.query(
            'CALL SP_TAO_DAT_PHONG(?, ?, ?, ?, ?, ?, ?, ?, @maDatPhong, @maBookingCode, @ketQua)',
            [
                data.customerId,
                data.staffId || null,
                data.checkIn,
                data.checkOut,
                data.guests,
                data.deposit || null,
                data.note || null,
                JSON.stringify(data.rooms)
            ]
        );
        const [[out]] = await conn.query(
            'SELECT @maDatPhong AS bookingId, @maBookingCode AS bookingCode, @ketQua AS result'
        );
        return out;
    } finally {
        conn.release();
    }
}

async function getBookings({ customerId } = {}) {
    let sql = `SELECT dp.MaDatPhong AS bookingId, dp.MaBookingCode AS bookingCode,
                      dp.MaKH AS customerId, dp.NgayDat AS bookedAt,
                      dp.NgayNhanDuKien AS checkIn, dp.NgayTraDuKien AS checkOut,
                      dp.SoNguoiDuKien AS guests, dp.TrangThai AS status, dp.GhiChu AS note,
                      GROUP_CONCAT(ctp.MaPhong) AS rooms
                 FROM DAT_PHONG dp
                 LEFT JOIN CHI_TIET_DAT_PHONG ctp ON ctp.MaDatPhong = dp.MaDatPhong`;
    const params = [];
    if (customerId) {
        sql += ' WHERE dp.MaKH = ?';
        params.push(customerId);
    }
    sql += ' GROUP BY dp.MaDatPhong ORDER BY dp.NgayDat DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function getBookingById(bookingId) {
    const [[booking]] = await pool.query(
        'SELECT * FROM DAT_PHONG WHERE MaDatPhong = ?',
        [bookingId]
    );
    if (!booking) return null;

    const [rooms] = await pool.query(
        'SELECT * FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong = ?',
        [bookingId]
    );
    return { ...booking, rooms };
}

async function cancelBooking(bookingId, customerId) {
    const [result] = await pool.query(
        `UPDATE DAT_PHONG SET TrangThai = 'CANCELLED'
          WHERE MaDatPhong = ? AND MaKH = ?`,
        [bookingId, customerId]
    );
    return result.affectedRows > 0;
}

module.exports = {
    searchAvailableRooms,
    createBooking,
    getBookings,
    getBookingById,
    cancelBooking
};