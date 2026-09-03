require('dotenv').config();

console.log('>>> SERVER.JS DANG CHAY <<<');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log(
    'DB_PASSWORD:',
    process.env.DB_PASSWORD ? 'DA CO' : 'DANG TRONG'
);

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Kết nối MySQL
const pool = require('../config/db');

// Cho phép Frontend gọi API từ Live Server
app.use(cors());

// Cho phép nhận JSON
app.use(express.json());


// ============================================================
// TEST SERVER
// ============================================================

app.get('/', (req, res) => {
    res.send('Hello Express!');
});


// ============================================================
// API DASHBOARD
// ============================================================

app.get('/api/dashboard', async (req, res) => {
    try {

        // ----------------------------------------------------
        // 1. DOANH THU HÔM NAY
        // ----------------------------------------------------

        const [revenueToday] = await pool.query(`
            SELECT
                COALESCE(SUM(TongTien), 0) AS doanhThuHomNay
            FROM HOA_DON
            WHERE TrangThai = 'PAID'
              AND DATE(NgayLap) = CURDATE()
        `);


        // ----------------------------------------------------
        // 2. DOANH THU THÁNG NÀY
        // ----------------------------------------------------

        const [revenueMonth] = await pool.query(`
            SELECT
                COALESCE(SUM(TongTien), 0) AS doanhThuThang
            FROM HOA_DON
            WHERE TrangThai = 'PAID'
              AND YEAR(NgayLap) = YEAR(CURDATE())
              AND MONTH(NgayLap) = MONTH(CURDATE())
        `);


        // ----------------------------------------------------
        // 3. THỐNG KÊ TRẠNG THÁI PHÒNG
        // ----------------------------------------------------

        const [rooms] = await pool.query(`
            SELECT
                TrangThai,
                COUNT(*) AS soLuong
            FROM PHONG
            GROUP BY TrangThai
        `);


        // ----------------------------------------------------
        // 4. TỶ LỆ LẤP ĐẦY
        // ----------------------------------------------------

        const [occupancy] = await pool.query(`
            SELECT
                COUNT(*) AS tongPhong,
                SUM(
                    CASE
                        WHEN TrangThai = 'OCCUPIED'
                        THEN 1
                        ELSE 0
                    END
                ) AS phongDangSuDung
            FROM PHONG
        `);

        const tongPhong = Number(
            occupancy[0].tongPhong || 0
        );

        const phongDangSuDung = Number(
            occupancy[0].phongDangSuDung || 0
        );

        const tyLeLapDay = tongPhong > 0
            ? Number(
                ((phongDangSuDung / tongPhong) * 100).toFixed(2)
            )
            : 0;


        // ----------------------------------------------------
        // 5. THỐNG KÊ NHÂN VIÊN
        // ----------------------------------------------------

        const [staff] = await pool.query(`
            SELECT
                COUNT(*) AS tongNhanVien,
                SUM(
                    CASE
                        WHEN NV.TrangThai = 'ACTIVE'
                         AND TK.TrangThai = 'ACTIVE'
                        THEN 1
                        ELSE 0
                    END
                ) AS dangHoatDong
            FROM NHAN_VIEN NV
            JOIN TAI_KHOAN TK
                ON NV.MaTaiKhoan = TK.MaTaiKhoan
        `);


        // ----------------------------------------------------
        // 6. DANH SÁCH NHÂN VIÊN
        // ----------------------------------------------------

        const [staffList] = await pool.query(`
            SELECT
                NV.MaNV,
                NV.HoTen,
                NV.EmailNV AS Email,
                NV.NgayVaoLam,
                NV.TrangThai AS trangThaiNhanVien,
                TK.VaiTro,
                TK.TrangThai AS trangThaiTaiKhoan
            FROM NHAN_VIEN NV
            JOIN TAI_KHOAN TK
                ON NV.MaTaiKhoan = TK.MaTaiKhoan
            WHERE TK.VaiTro = 'STAFF'
            ORDER BY NV.MaNV
        `);


        // ----------------------------------------------------
        // 7. DOANH THU THEO NGÀY
        // ----------------------------------------------------

        const [revenueChart] = await pool.query(`
            SELECT
                DATE(NgayLap) AS ngay,
                COALESCE(SUM(TongTien), 0) AS doanhThu
            FROM HOA_DON
            WHERE TrangThai = 'PAID'
            GROUP BY DATE(NgayLap)
            ORDER BY DATE(NgayLap) DESC
            LIMIT 7
        `);


        // ----------------------------------------------------
        // 8. TỔNG SỐ BOOKING
        // ----------------------------------------------------

        const [bookings] = await pool.query(`
            SELECT
                COUNT(*) AS soBooking
            FROM DAT_PHONG
        `);


        // ----------------------------------------------------
        // 9. TRẢ DỮ LIỆU VỀ FRONTEND
        // ----------------------------------------------------

        res.json({
            success: true,

            revenue: {
                doanhThuHomNay:
                    revenueToday[0].doanhThuHomNay,

                doanhThuThang:
                    revenueMonth[0].doanhThuThang
            },

            rooms: rooms,

            occupancy: {
                tongPhong: tongPhong,
                phongDangSuDung: phongDangSuDung,
                tyLeLapDay: tyLeLapDay
            },

            staff: {
                tongNhanVien:
                    Number(staff[0].tongNhanVien || 0),

                dangHoatDong:
                    Number(staff[0].dangHoatDong || 0)
            },

            staffList: staffList,

            bookings: {
                soBooking:
                    Number(bookings[0].soBooking || 0)
            },

            revenueChart:
                revenueChart.reverse()
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


// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log(
        `Server dang chay tai http://localhost:${PORT}`
    );
});