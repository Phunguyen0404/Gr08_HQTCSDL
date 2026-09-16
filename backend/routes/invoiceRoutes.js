const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Lấy danh sách tất cả hóa đơn
router.get('/', async (req, res) => {
    try {
        const [invoices] = await pool.query(`
            SELECT
                HD.MaHoaDon,
                HD.MaLuuTru,
                HD.NgayLap,
                HD.TongTienPhong,
                HD.Thue,
                HD.GiamGia,
                HD.TongTien,
                HD.TrangThai,
                HD.GhiChuHoaDon,
                COALESCE(KH.HoTen, KH_BOOKER.HoTen, 'Khách vãng lai') AS HoTen,
                COALESCE(KH.MaKH, KH_BOOKER.MaKH) AS MaKH,
                DP.MaBookingCode,
                COALESCE((
                    SELECT SUM(TT.SoTien)
                    FROM THANH_TOAN TT
                    WHERE TT.MaHoaDon = HD.MaHoaDon
                      AND TT.TrangThai = 'COMPLETED'
                ), 0) AS DaThanhToan
            FROM HOA_DON HD
            JOIN LUU_TRU LT ON HD.MaLuuTru = LT.MaLuuTru
            LEFT JOIN DAT_PHONG DP ON LT.MaDatPhong = DP.MaDatPhong
            LEFT JOIN KHACH_HANG KH ON DP.MaKH = KH.MaKH
            LEFT JOIN KHACH_LUU_TRU KLT ON LT.MaLuuTru = KLT.MaLuuTru AND KLT.VaiTro = 'BOOKER'
            LEFT JOIN KHACH_HANG KH_BOOKER ON KLT.MaKH = KH_BOOKER.MaKH
            ORDER BY HD.NgayLap DESC
        `);

        res.json({
            success: true,
            invoices,
            data: invoices
        });
    } catch (error) {
        console.error('LỖI API INVOICES:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy dữ liệu hóa đơn',
            error: error.message
        });
    }
});

// Chi tiết hóa đơn theo ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [invoices] = await pool.query(`
            SELECT
                HD.MaHoaDon,
                HD.MaLuuTru,
                HD.NgayLap,
                HD.TongTienPhong,
                HD.Thue,
                HD.GiamGia,
                HD.TongTien,
                HD.TrangThai,
                HD.GhiChuHoaDon,
                COALESCE(KH.HoTen, KH_BOOKER.HoTen, 'Khách vãng lai') AS HoTen,
                COALESCE(KH.MaKH, KH_BOOKER.MaKH) AS MaKH,
                COALESCE(KH.SoDienThoai, KH_BOOKER.SoDienThoai) AS SoDienThoai,
                COALESCE(KH.Email, KH_BOOKER.Email) AS Email,
                COALESCE(KH.CCCD, KH_BOOKER.CCCD) AS CCCD,
                DP.MaBookingCode,
                DP.NgayNhanDuKien,
                DP.NgayTraDuKien,
                LT.CheckInAt,
                LT.CheckOutAt,
                COALESCE((
                    SELECT SUM(TT.SoTien)
                    FROM THANH_TOAN TT
                    WHERE TT.MaHoaDon = HD.MaHoaDon
                      AND TT.TrangThai = 'COMPLETED'
                ), 0) AS DaThanhToan
            FROM HOA_DON HD
            JOIN LUU_TRU LT ON HD.MaLuuTru = LT.MaLuuTru
            LEFT JOIN DAT_PHONG DP ON LT.MaDatPhong = DP.MaDatPhong
            LEFT JOIN KHACH_HANG KH ON DP.MaKH = KH.MaKH
            LEFT JOIN KHACH_LUU_TRU KLT ON LT.MaLuuTru = KLT.MaLuuTru AND KLT.VaiTro = 'BOOKER'
            LEFT JOIN KHACH_HANG KH_BOOKER ON KLT.MaKH = KH_BOOKER.MaKH
            WHERE HD.MaHoaDon = ?
        `, [id]);

        if (!invoices.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
        }

        const invoice = invoices[0];

        // Lấy danh sách phòng
        const [rooms] = await pool.query(`
            SELECT ctp.MaPhong, p.SoPhong, lp.TenLoaiPhong, ctp.DonGiaDat
            FROM LUU_TRU LT
            JOIN DAT_PHONG DP ON DP.MaDatPhong = LT.MaDatPhong
            JOIN CHI_TIET_DAT_PHONG ctp ON ctp.MaDatPhong = DP.MaDatPhong
            JOIN PHONG p ON p.MaPhong = ctp.MaPhong
            JOIN LOAI_PHONG lp ON lp.MaLoaiPhong = p.MaLoaiPhong
            WHERE LT.MaLuuTru = ?
        `, [invoice.MaLuuTru]);

        // Lấy lịch sử thanh toán
        const [payments] = await pool.query(`
            SELECT MaThanhToan, NgayThanhToan, PhuongThuc, SoTien, TrangThai
            FROM THANH_TOAN
            WHERE MaHoaDon = ?
            ORDER BY NgayThanhToan ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...invoice,
                rooms,
                payments
            }
        });
    } catch (error) {
        console.error('LỖI API INVOICE DETAIL:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Xác nhận thanh toán hóa đơn
router.post('/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, method } = req.body;

        const [[hd]] = await pool.query('SELECT * FROM HOA_DON WHERE MaHoaDon = ?', [id]);
        if (!hd) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
        }

        const payAmount = Number(amount) || Number(hd.TongTien);
        const payMethod = method || 'CASH';

        const [[maxTt]] = await pool.query('SELECT IFNULL(MAX(CAST(SUBSTRING(MaThanhToan, 3) AS UNSIGNED)), 0) + 1 AS nextId FROM THANH_TOAN');
        const maThanhToan = 'TT' + String(maxTt.nextId).padStart(3, '0');

        await pool.query(`
            INSERT INTO THANH_TOAN (MaThanhToan, MaHoaDon, NgayThanhToan, PhuongThuc, SoTien, TrangThai)
            VALUES (?, ?, NOW(), ?, ?, 'COMPLETED')
        `, [maThanhToan, id, payMethod, payAmount]);

        await pool.query(`UPDATE HOA_DON SET TrangThai = 'PAID' WHERE MaHoaDon = ?`, [id]);

        res.json({ success: true, message: 'Thanh toán thành công!' });
    } catch (error) {
        console.error('LỖI API PAY INVOICE:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
