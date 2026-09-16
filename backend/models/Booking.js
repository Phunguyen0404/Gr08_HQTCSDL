const pool = require('../config/db');

async function searchAvailableRooms(checkIn, checkOut, guests) {
    const guestCount = Math.max(1, Number(guests) || 1);
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
        [guestCount, checkOut, checkIn]
    );
    return rows;
}

async function resolveCustomerId(identifier) {
    if (!identifier) return null;

    const [rows] = await pool.query(
        `SELECT MaKH FROM KHACH_HANG
          WHERE MaKH = ? OR MaTaiKhoan = ?
          LIMIT 1`,
        [identifier, identifier]
    );

    if (rows.length > 0) {
        return rows[0].MaKH;
    }

    // Nếu là MaTaiKhoan nhưng chưa có record trong KHACH_HANG
    const [accRows] = await pool.query(
        `SELECT MaTaiKhoan, TenDangNhap FROM TAI_KHOAN WHERE MaTaiKhoan = ? LIMIT 1`,
        [identifier]
    );
    if (accRows.length > 0) {
        const User = require('./User');
        const cust = await User.getOrCreateCustomerForAccount(identifier, accRows[0].TenDangNhap);
        return cust.MaKH;
    }

    return identifier;
}

async function createBooking(data) {
    const conn = await pool.getConnection();
    try {
        const maKH = await resolveCustomerId(data.customerId || data.maKH);

        // Chuẩn hóa danh sách phòng sang PascalCase khớp JSON_TABLE
        const rawRooms = data.rooms || data.danhSachPhong || [];
        const formattedRooms = rawRooms.map((r) => ({
            MaPhong: r.MaPhong || r.maPhong || r.code || r.roomId,
            DonGia: Number(r.DonGia || r.donGia || r.price || 0),
            GhiChu: r.GhiChu || r.ghiChu || r.note || ''
        }));

        await conn.query(
            'CALL SP_TAO_DAT_PHONG(?, ?, ?, ?, ?, ?, ?, ?, @maDatPhong, @maBookingCode, @ketQua)',
            [
                maKH,
                data.staffId || null,
                data.checkIn || data.ngayNhanDuKien,
                data.checkOut || data.ngayTraDuKien,
                Number(data.guests || data.soNguoiDuKien) || 1,
                data.deposit || data.tienCoc || null,
                data.note || data.ghiChu || null,
                JSON.stringify(formattedRooms)
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
                      dp.SoNguoiDuKien AS guests, dp.TienCocDuKien AS deposit,
                      dp.TrangThai AS status, dp.GhiChu AS note,
                      dp.MaDatPhong, dp.MaBookingCode, dp.TrangThai, dp.NgayDat,
                      dp.NgayNhanDuKien, dp.NgayTraDuKien, dp.SoNguoiDuKien, dp.TienCocDuKien,
                      kh.HoTen, kh.SoDienThoai, kh.CCCD,
                      GROUP_CONCAT(ctp.MaPhong SEPARATOR ', ') AS rooms,
                      GROUP_CONCAT(CONCAT(p.SoPhong, ' (', lp.TenLoaiPhong, ')') SEPARATOR ', ') AS roomNames,
                      SUM(ctp.DonGiaDat) AS totalRoomRate
                 FROM DAT_PHONG dp
                 LEFT JOIN KHACH_HANG kh ON kh.MaKH = dp.MaKH
                 LEFT JOIN CHI_TIET_DAT_PHONG ctp ON ctp.MaDatPhong = dp.MaDatPhong
                 LEFT JOIN PHONG p ON p.MaPhong = ctp.MaPhong
                 LEFT JOIN LOAI_PHONG lp ON lp.MaLoaiPhong = p.MaLoaiPhong`;
    const params = [];
    if (customerId) {
        const resolvedId = await resolveCustomerId(customerId);
        sql += ' WHERE dp.MaKH = ?';
        params.push(resolvedId);
    }
    sql += ' GROUP BY dp.MaDatPhong ORDER BY dp.NgayDat DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
}

async function getBookingById(bookingId) {
    const [[booking]] = await pool.query(
        `SELECT dp.*, kh.HoTen, kh.SoDienThoai, kh.Email, kh.CCCD
           FROM DAT_PHONG dp
           LEFT JOIN KHACH_HANG kh ON kh.MaKH = dp.MaKH
          WHERE dp.MaDatPhong = ? OR dp.MaBookingCode = ?`,
        [bookingId, bookingId]
    );
    if (!booking) return null;

    const [rooms] = await pool.query(
        `SELECT ctp.*, p.SoPhong, lp.TenLoaiPhong, lp.GiaCoBan
           FROM CHI_TIET_DAT_PHONG ctp
           JOIN PHONG p ON p.MaPhong = ctp.MaPhong
           JOIN LOAI_PHONG lp ON lp.MaLoaiPhong = p.MaLoaiPhong
          WHERE ctp.MaDatPhong = ?`,
        [booking.MaDatPhong]
    );

    const [[stay]] = await pool.query(
        `SELECT * FROM LUU_TRU WHERE MaDatPhong = ? LIMIT 1`,
        [booking.MaDatPhong]
    );

    return { ...booking, rooms, stay: stay || null };
}

async function cancelBooking(bookingId, customerId) {
    let sql = `UPDATE DAT_PHONG SET TrangThai = 'CANCELLED' WHERE (MaDatPhong = ? OR MaBookingCode = ?)`;
    const params = [bookingId, bookingId];

    if (customerId) {
        const resolvedId = await resolveCustomerId(customerId);
        sql += ` AND MaKH = ?`;
        params.push(resolvedId);
    }

    const [result] = await pool.query(sql, params);
    return result.affectedRows > 0;
}

async function checkInBooking(bookingId, staffId) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const booking = await getBookingById(bookingId);
        if (!booking) {
            throw new Error('Không tìm thấy đơn đặt phòng');
        }

        if (booking.TrangThai === 'CHECKED_IN' || booking.TrangThai === 'COMPLETED') {
            throw new Error('Đơn đặt phòng đã được check-in trước đó.');
        }

        // Sinh MaLuuTru
        const [[maxRow]] = await conn.query(
            `SELECT IFNULL(MAX(CAST(SUBSTRING(MaLuuTru, 3) AS UNSIGNED)), 0) + 1 AS nextId FROM LUU_TRU`
        );
        const maLuuTru = 'LT' + String(maxRow.nextId).padStart(3, '0');

        await conn.query(
            `INSERT INTO LUU_TRU (MaLuuTru, MaDatPhong, CheckInAt, CheckOutDuKien, TrangThai, GhiChuLuuTru)
             VALUES (?, ?, NOW(), ?, 'IN_HOUSE', ?)`,
            [maLuuTru, booking.MaDatPhong, booking.NgayTraDuKien, `Check-in theo đơn ${booking.MaBookingCode}`]
        );

        // Ghi nhận khách lưu trú
        await conn.query(
            `INSERT INTO KHACH_LUU_TRU (MaLuuTru, MaKH, VaiTro)
             VALUES (?, ?, 'BOOKER')
             ON DUPLICATE KEY UPDATE VaiTro = VALUES(VaiTro)`,
            [maLuuTru, booking.MaKH]
        );

        // Đổi trạng thái đơn đặt sang CHECKED_IN
        await conn.query(
            `UPDATE DAT_PHONG SET TrangThai = 'CHECKED_IN' WHERE MaDatPhong = ?`,
            [booking.MaDatPhong]
        );

        // Cập nhật trạng thái các phòng sang OCCUPIED (Đang thuê)
        for (const room of booking.rooms) {
            await conn.query(
                `UPDATE PHONG SET TrangThai = 'OCCUPIED' WHERE MaPhong = ?`,
                [room.MaPhong]
            );
        }

        await conn.commit();
        return { success: true, maLuuTru, message: 'Nhận phòng (Check-in) thành công!' };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

async function checkOutBooking(bookingId, staffId) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const booking = await getBookingById(bookingId);
        if (!booking) {
            throw new Error('Không tìm thấy đơn đặt phòng');
        }

        const [[stay]] = await conn.query(
            `SELECT * FROM LUU_TRU WHERE MaDatPhong = ? LIMIT 1`,
            [booking.MaDatPhong]
        );

        if (!stay) {
            throw new Error('Chưa có thông tin nhận phòng (Lưu trú) cho đơn này.');
        }

        // 1. Cập nhật Lưu trú
        await conn.query(
            `UPDATE LUU_TRU SET TrangThai = 'CHECKED_OUT', CheckOutAt = NOW() WHERE MaLuuTru = ?`,
            [stay.MaLuuTru]
        );

        // 2. Cập nhật đơn đặt phòng sang COMPLETED
        await conn.query(
            `UPDATE DAT_PHONG SET TrangThai = 'COMPLETED' WHERE MaDatPhong = ?`,
            [booking.MaDatPhong]
        );

        // 3. Đổi trạng thái các phòng sang CLEANING (Đang dọn dẹp)
        for (const room of booking.rooms) {
            await conn.query(
                `UPDATE PHONG SET TrangThai = 'CLEANING' WHERE MaPhong = ?`,
                [room.MaPhong]
            );
        }

        // 4. Tính toán số tiền & Sinh Hóa đơn
        const checkInTime = new Date(stay.CheckInAt || booking.NgayNhanDuKien);
        const checkOutTime = new Date();
        const diffDays = Math.max(1, Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24)));

        let roomTotal = 0;
        for (const room of booking.rooms) {
            roomTotal += Number(room.DonGiaDat || room.GiaCoBan || 500000) * diffDays;
        }

        const vat = Math.round(roomTotal * 0.1);
        const deposit = Number(booking.TienCocDuKien || 0);
        const totalAmount = roomTotal + vat;

        // Sinh MaHoaDon
        const [[maxHdRow]] = await conn.query(
            `SELECT IFNULL(MAX(CAST(SUBSTRING(MaHoaDon, 3) AS UNSIGNED)), 0) + 1 AS nextId FROM HOA_DON`
        );
        const maHoaDon = 'HD' + String(maxHdRow.nextId).padStart(3, '0');

        await conn.query(
            `INSERT INTO HOA_DON (MaHoaDon, MaLuuTru, NgayLap, TongTienPhong, Thue, GiamGia, TongTien, TrangThai, GhiChuHoaDon)
             VALUES (?, ?, NOW(), ?, ?, 0, ?, 'PAID', ?)`,
            [maHoaDon, stay.MaLuuTru, roomTotal, vat, totalAmount, `Hóa đơn thanh toán khi trả phòng ${booking.MaBookingCode}`]
        );

        // Ghi nhận thanh toán
        const [[maxTtRow]] = await conn.query(
            `SELECT IFNULL(MAX(CAST(SUBSTRING(MaThanhToan, 3) AS UNSIGNED)), 0) + 1 AS nextId FROM THANH_TOAN`
        );
        const maThanhToan = 'TT' + String(maxTtRow.nextId).padStart(3, '0');

        await conn.query(
            `INSERT INTO THANH_TOAN (MaThanhToan, MaDatPhong, MaHoaDon, NgayThanhToan, PhuongThuc, SoTien, TrangThai)
             VALUES (?, ?, ?, NOW(), 'CASH', ?, 'COMPLETED')`,
            [maThanhToan, bookingId, maHoaDon, totalAmount]
        );

        await conn.commit();
        return {
            success: true,
            maHoaDon,
            totalAmount,
            message: 'Trả phòng (Check-out) và xuất hóa đơn thành công!'
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

module.exports = {
    searchAvailableRooms,
    createBooking,
    getBookings,
    getBookingById,
    cancelBooking,
    checkInBooking,
    checkOutBooking,
    resolveCustomerId
};