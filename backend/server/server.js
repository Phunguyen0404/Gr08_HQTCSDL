const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
});

const express = require('express');
const cors = require('cors');
const pool = require('../config/db');
const roomRoutes = require('../routes/roomRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Hotel Management API đang chạy.'
    });
});

app.get('/api/dashboard', async (req, res) => {
    try {
        const [revenueToday] = await pool.query(`
            SELECT COALESCE(SUM(TongTien), 0) AS doanhThuHomNay
            FROM HOA_DON
            WHERE TrangThai = 'PAID'
              AND DATE(NgayLap) = CURDATE()
        `);

        const [revenueMonth] = await pool.query(`
            SELECT COALESCE(SUM(TongTien), 0) AS doanhThuThang
            FROM HOA_DON
            WHERE TrangThai = 'PAID'
              AND YEAR(NgayLap) = YEAR(CURDATE())
              AND MONTH(NgayLap) = MONTH(CURDATE())
        `);

        const [rooms] = await pool.query(`
            SELECT TrangThai, COUNT(*) AS soLuong
            FROM PHONG
            GROUP BY TrangThai
        `);

        const [occupancy] = await pool.query(`
            SELECT
                COUNT(*) AS tongPhong,
                SUM(CASE WHEN TrangThai = 'OCCUPIED' THEN 1 ELSE 0 END) AS phongDangSuDung
            FROM PHONG
        `);

        const tongPhong = Number(occupancy[0]?.tongPhong || 0);
        const phongDangSuDung = Number(occupancy[0]?.phongDangSuDung || 0);
        const tyLeLapDay = tongPhong > 0
            ? Number(((phongDangSuDung / tongPhong) * 100).toFixed(2))
            : 0;

        const [staff] = await pool.query(`
            SELECT
                COUNT(*) AS tongNhanVien,
                SUM(CASE WHEN NV.TrangThai = 'ACTIVE' AND TK.TrangThai = 'ACTIVE' THEN 1 ELSE 0 END) AS dangHoatDong
            FROM NHAN_VIEN NV
            JOIN TAI_KHOAN TK ON NV.MaTaiKhoan = TK.MaTaiKhoan
        `);

        const [staffList] = await pool.query(`
            SELECT NV.MaNV, NV.HoTen, NV.Email, NV.NgayVaoLam, NV.TrangThai AS trangThaiNhanVien,
                   TK.VaiTro, TK.TrangThai AS trangThaiTaiKhoan
            FROM NHAN_VIEN NV
            JOIN TAI_KHOAN TK ON NV.MaTaiKhoan = TK.MaTaiKhoan
            ORDER BY NV.MaNV
        `);

        const [revenueChart] = await pool.query(`
            SELECT DATE(NgayLap) AS ngay, COALESCE(SUM(TongTien), 0) AS doanhThu
            FROM HOA_DON
            WHERE TrangThai = 'PAID'
            GROUP BY DATE(NgayLap)
            ORDER BY DATE(NgayLap) DESC
            LIMIT 7
        `);

        const [bookings] = await pool.query(`
            SELECT COUNT(*) AS soBooking
            FROM DAT_PHONG
        `);

        res.json({
            success: true,
            revenue: {
                today: Number(revenueToday[0]?.doanhThuHomNay || 0),
                month: Number(revenueMonth[0]?.doanhThuThang || 0),
                doanhThuHomNay: Number(revenueToday[0]?.doanhThuHomNay || 0),
                doanhThuThang: Number(revenueMonth[0]?.doanhThuThang || 0)
            },
            rooms: rooms,
            occupancy: {
                tongPhong,
                phongDangSuDung,
                tyLeLapDay
            },
            staff: {
                total: Number(staff[0]?.tongNhanVien || 0),
                active: Number(staff[0]?.dangHoatDong || 0),
                tongNhanVien: Number(staff[0]?.tongNhanVien || 0),
                dangHoatDong: Number(staff[0]?.dangHoatDong || 0)
            },
            staffList,
            bookings: {
                soBooking: Number(bookings[0]?.soBooking || 0)
            },
            revenueChart: [...(revenueChart || [])].reverse()
        });
    } catch (error) {
        console.error('LỖI API DASHBOARD:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy dữ liệu Dashboard',
            error: error.message
        });
    }
});

app.get('/api/staff', async (req, res) => {
    try {
        const [staffList] = await pool.query(`
            SELECT NV.MaNV, NV.HoTen, NV.Email, NV.SoDienThoai, NV.ChucVu, NV.NgayVaoLam,
                   NV.TrangThai AS trangThaiNhanVien,
                   TK.VaiTro, TK.TrangThai AS trangThaiTaiKhoan
            FROM NHAN_VIEN NV
            JOIN TAI_KHOAN TK ON NV.MaTaiKhoan = TK.MaTaiKhoan
            ORDER BY NV.MaNV
        `);

        res.json({
            success: true,
            data: staffList
        });
    } catch (error) {
        console.error('LỖI API STAFF:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy dữ liệu nhân viên',
            error: error.message
        });
    }
});

app.use('/api', roomRoutes);

app.listen(PORT, () => {
    console.log(`Server dang chay tai http://localhost:${PORT}`);
});