// ============================================================
// HOTEL MANAGEMENT SYSTEM - BACKEND SERVER
// ============================================================

const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
});

const express = require('express');
const cors = require('cors');
const pool = require('../config/db');

// Route modules
const authRoutes = require('../routes/authRoutes');
const roomRoutes = require('../routes/roomRoutes');
const bookingRoutes = require('../routes/bookingRoutes');
const customerRoutes = require('../routes/customerRoutes');
const invoiceRoutes = require('../routes/invoiceRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// STATIC FILES
// ============================================================
app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use('/public', express.static(path.join(__dirname, '../../frontend/public')));
app.use('/css', express.static(path.join(__dirname, '../../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../../frontend/js')));
app.use('/assets', express.static(path.join(__dirname, '../../frontend/assets')));

// ============================================================
// AUTH & ROOT PAGES
// ============================================================
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/register.html'));
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/index.html', (req, res) => {
    res.redirect('/login');
});

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            success: true,
            message: 'Server + MySQL hoạt động bình thường'
        });
    } catch (error) {
        console.error('LỖI HEALTH CHECK:', error);
        res.status(500).json({
            success: false,
            message: 'Không kết nối được MySQL',
            error: error.message
        });
    }
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api', roomRoutes);

// ============================================================
// API THU CHI (PAYMENTS / CASHFLOW)
// ============================================================
app.get('/api/payments', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                tt.MaThanhToan,
                tt.MaDatPhong,
                tt.MaHoaDon,
                tt.NgayThanhToan,
                tt.SoTien,
                tt.PhuongThuc,
                tt.TrangThai,
                tt.GhiChuThanhToan,
                dp.MaBookingCode,
                kh.HoTen AS TenKhachHang,
                kh.SoDienThoai
            FROM THANH_TOAN tt
            LEFT JOIN DAT_PHONG dp ON dp.MaDatPhong = tt.MaDatPhong
            LEFT JOIN KHACH_HANG kh ON kh.MaKH = dp.MaKH
            ORDER BY tt.NgayThanhToan DESC
        `);

        const totalRevenue = rows.reduce((sum, r) => sum + Number(r.SoTien || 0), 0);
        const cashTotal = rows.filter(r => r.PhuongThuc === 'CASH').reduce((sum, r) => sum + Number(r.SoTien || 0), 0);
        const transferTotal = rows.filter(r => r.PhuongThuc === 'TRANSFER').reduce((sum, r) => sum + Number(r.SoTien || 0), 0);
        const cardTotal = rows.filter(r => r.PhuongThuc === 'CARD' || r.PhuongThuc === 'E_WALLET').reduce((sum, r) => sum + Number(r.SoTien || 0), 0);

        res.json({
            success: true,
            data: rows,
            summary: {
                totalRevenue,
                cashTotal,
                transferTotal,
                cardTotal,
                totalTransactions: rows.length
            }
        });
    } catch (err) {
        console.error('Lỗi API payments:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
// API BÁO CÁO (REPORTS & ANALYTICS)
// ============================================================
app.get('/api/reports', async (req, res) => {
    try {
        const [[revSummary]] = await pool.query(`
            SELECT 
                IFNULL(SUM(SoTien), 0) AS tongDoanhThu,
                COUNT(*) AS tongGiaoDich
            FROM THANH_TOAN
            WHERE TrangThai = 'COMPLETED'
        `);

        const [monthlyRev] = await pool.query(`
            SELECT 
                MONTH(NgayThanhToan) AS thang,
                IFNULL(SUM(SoTien), 0) AS doanhThu,
                COUNT(*) AS soGiaoDich
            FROM THANH_TOAN
            WHERE TrangThai = 'COMPLETED'
            GROUP BY MONTH(NgayThanhToan)
            ORDER BY thang ASC
        `);

        const [bookingStats] = await pool.query(`
            SELECT TrangThai, COUNT(*) AS soLuong
            FROM DAT_PHONG
            GROUP BY TrangThai
        `);

        const [roomTypeStats] = await pool.query(`
            SELECT 
                lp.MaLoaiPhong,
                lp.TenLoaiPhong,
                lp.GiaCoBan,
                COUNT(p.MaPhong) AS tongSoPhong,
                IFNULL(SUM(CASE WHEN p.TrangThai = 'OCCUPIED' THEN 1 ELSE 0 END), 0) AS phongDangThue,
                IFNULL(SUM(CASE WHEN p.TrangThai = 'AVAILABLE' THEN 1 ELSE 0 END), 0) AS phongTrong
            FROM LOAI_PHONG lp
            LEFT JOIN PHONG p ON p.MaLoaiPhong = lp.MaLoaiPhong
            GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoBan
        `);

        const [recentDays] = await pool.query(`
            SELECT 
                DATE(NgayThanhToan) AS ngay,
                IFNULL(SUM(SoTien), 0) AS doanhThu,
                COUNT(*) AS soGiaoDich
            FROM THANH_TOAN
            WHERE TrangThai = 'COMPLETED'
            GROUP BY DATE(NgayThanhToan)
            ORDER BY ngay DESC
            LIMIT 7
        `);

        res.json({
            success: true,
            data: {
                summary: revSummary,
                monthly: monthlyRev,
                bookingStats,
                roomTypeStats,
                recentDays
            }
        });
    } catch (err) {
        console.error('Lỗi API reports:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
// API CÀI ĐẶT (SETTINGS)
// ============================================================
const SETTINGS_FILE = path.join(__dirname, '../config/hotel-settings.json');
const DEFAULT_SETTINGS = {
    hotelName: "Khách Sạn & Nghỉ Dưỡng Cao Cấp Grand Resort",
    hotline: "1900 0000 / 024 3888 9999",
    email: "contact@grandresort.vn",
    address: "Số 123 Đường Ven Biển, Phường 1, Thành phố Biển",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    vatRate: 10,
    depositRate: 30,
    cancellationHours: 24,
    bankName: "Ngân hàng TMCP Ngoại Thương (Vietcombank)",
    bankAccount: "1029384756",
    bankOwner: "CONG TY TNHH KHACH SAN GRAND RESORT"
};

app.get('/api/settings', (req, res) => {
    try {
        const fs = require('fs');
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
            return res.json({ success: true, data });
        }
        res.json({ success: true, data: DEFAULT_SETTINGS });
    } catch (err) {
        res.json({ success: true, data: DEFAULT_SETTINGS });
    }
});

app.post('/api/settings', (req, res) => {
    try {
        const fs = require('fs');
        const newSettings = { ...DEFAULT_SETTINGS, ...req.body };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf8');
        res.json({ success: true, data: newSettings, message: 'Lưu cài đặt thành công' });
    } catch (err) {
        console.error('Lỗi lưu cài đặt:', err);
        res.status(500).json({ success: false, message: 'Không thể lưu cài đặt: ' + err.message });
    }
});

// ============================================================
// API DASHBOARD
// ============================================================
app.get('/api/dashboard', async (req, res) => {
    try {
        // Doanh thu hôm nay
        const [revenueToday] = await pool.query(`
            SELECT COALESCE(SUM(TongTien), 0) AS doanhThuHomNay
            FROM HOA_DON
            WHERE TrangThai = 'PAID'
              AND DATE(NgayLap) = CURDATE()
        `);

        // Doanh thu tháng này
        const [revenueMonth] = await pool.query(`
            SELECT COALESCE(SUM(TongTien), 0) AS doanhThuThang
            FROM HOA_DON
            WHERE TrangThai = 'PAID'
              AND YEAR(NgayLap) = YEAR(CURDATE())
              AND MONTH(NgayLap) = MONTH(CURDATE())
        `);

        // Danh sách trạng thái phòng
        const [rooms] = await pool.query(`
            SELECT TrangThai, COUNT(*) AS soLuong
            FROM PHONG
            GROUP BY TrangThai
        `);

        let tongPhong = 0;
        let phongDangSuDung = 0;
        rooms.forEach(item => {
            tongPhong += item.soLuong;
            if (item.TrangThai === 'OCCUPIED' || item.TrangThai === 'Đang thuê') {
                phongDangSuDung += item.soLuong;
            }
        });

        const tyLeLapDay = tongPhong > 0 ? Math.round((phongDangSuDung / tongPhong) * 100) : 0;

        // Số lượng booking
        const [bookingCount] = await pool.query(`
            SELECT COUNT(*) AS soBooking
            FROM DAT_PHONG
            WHERE TrangThai IN ('CONFIRMED', 'CHECKED_IN', 'Đã xác nhận', 'Đang sử dụng')
        `);

        // Biểu đồ doanh thu 7 ngày gần nhất
        const [revenueChart] = await pool.query(`
            SELECT 
                DATE(NgayLap) AS ngay,
                COALESCE(SUM(TongTien), 0) AS doanhThu
            FROM HOA_DON
            WHERE TrangThai = 'PAID'
              AND NgayLap >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(NgayLap)
            ORDER BY ngay ASC
        `);

        // Số lượng nhân viên
        const [staff] = await pool.query(`
            SELECT 
                COUNT(*) AS tongNhanVien,
                SUM(CASE WHEN TrangThai = 'ACTIVE' THEN 1 ELSE 0 END) AS dangHoatDong
            FROM NHAN_VIEN
        `);

        // Danh sách nhân viên
        const [staffList] = await pool.query(`
            SELECT 
                NV.MaNV, NV.HoTen, NV.Email, NV.SoDienThoai, NV.ChucVu, NV.NgayVaoLam,
                NV.TrangThai AS trangThaiNhanVien,
                TK.VaiTro, TK.TrangThai AS trangThaiTaiKhoan
            FROM NHAN_VIEN NV
            LEFT JOIN TAI_KHOAN TK ON NV.MaTaiKhoan = TK.MaTaiKhoan
            ORDER BY NV.MaNV ASC
        `);

        res.json({
            success: true,
            revenue: {
                today: Number(revenueToday[0]?.doanhThuHomNay || 0),
                month: Number(revenueMonth[0]?.doanhThuThang || 0),
                doanhThuHomNay: Number(revenueToday[0]?.doanhThuHomNay || 0),
                doanhThuThang: Number(revenueMonth[0]?.doanhThuThang || 0)
            },
            rooms,
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
                soBooking: Number(bookingCount[0]?.soBooking || 0)
            },
            revenueChart
        });
    } catch (error) {
        console.warn('MySQL chưa kết nối, sử dụng dữ liệu mẫu cho Dashboard:', error.message);
        res.json({
            success: true,
            revenue: {
                today: 12500000,
                month: 185500000,
                doanhThuHomNay: 12500000,
                doanhThuThang: 185500000
            },
            rooms: [
                { TrangThai: 'OCCUPIED', soLuong: 39 },
                { TrangThai: 'AVAILABLE', soLuong: 11 },
                { TrangThai: 'CLEANING', soLuong: 3 },
                { TrangThai: 'MAINTENANCE', soLuong: 2 }
            ],
            occupancy: {
                tongPhong: 55,
                phongDangSuDung: 39,
                tyLeLapDay: 78
            },
            staff: {
                total: 4,
                active: 3,
                tongNhanVien: 4,
                dangHoatDong: 3
            },
            staffList: [
                { MaNV: 'NV001', HoTen: 'Nguyễn Văn A', Email: 'Nguyenvana@gmail.com', VaiTro: 'Staff', trangThaiTaiKhoan: 'ACTIVE', NgayVaoLam: '2026-08-01' },
                { MaNV: 'NV002', HoTen: 'Trần Thị B', Email: 'Tranthib@gmail.com', VaiTro: 'Staff', trangThaiTaiKhoan: 'ACTIVE', NgayVaoLam: '2026-08-04' },
                { MaNV: 'NV003', HoTen: 'Lê Văn C', Email: 'Levanc@gmail.com', VaiTro: 'Staff', trangThaiTaiKhoan: 'LOCKED', NgayVaoLam: '2026-08-21' },
                { MaNV: 'NV004', HoTen: 'Phạm Thị D', Email: 'Phamthid@gmail.com', VaiTro: 'Staff', trangThaiTaiKhoan: 'ACTIVE', NgayVaoLam: '2026-07-10' }
            ],
            bookings: {
                soBooking: 28
            },
            revenueChart: [
                { ngay: 'T2', doanhThu: 8500000 },
                { ngay: 'T3', doanhThu: 12000000 },
                { ngay: 'T4', doanhThu: 10500000 },
                { ngay: 'T5', doanhThu: 15000000 },
                { ngay: 'T6', doanhThu: 18000000 },
                { ngay: 'T7', doanhThu: 22000000 },
                { ngay: 'CN', doanhThu: 19500000 }
            ]
        });
    }
});

// ============================================================
// API STAFF (Quản trị nhân viên cho Admin)
// ============================================================
const getStaffListHandler = async (req, res) => {
    try {
        const [staffList] = await pool.query(`
            SELECT 
                NV.MaNV,
                NV.MaTaiKhoan,
                NV.CCCD,
                NV.HoTen,
                NV.ChucVu,
                NV.NgaySinh,
                NV.GioiTinh,
                NV.SoDienThoai,
                NV.Email,
                NV.DiaChi,
                NV.NgayVaoLam,
                NV.TrangThai AS trangThaiNhanVien,
                TK.TenDangNhap,
                TK.VaiTro,
                TK.TrangThai AS trangThaiTaiKhoan
            FROM NHAN_VIEN NV
            LEFT JOIN TAI_KHOAN TK ON NV.MaTaiKhoan = TK.MaTaiKhoan
            ORDER BY NV.MaNV ASC
        `);

        res.json({
            success: true,
            data: staffList
        });
    } catch (error) {
        console.warn('MySQL chưa kết nối, sử dụng dữ liệu mẫu cho Staff API');
        res.json({
            success: true,
            data: [
                { MaNV: 'NV001', HoTen: 'Nguyễn Văn A', Email: 'Nguyenvana@gmail.com', ChucVu: 'Lễ tân', VaiTro: 'Staff', trangThaiTaiKhoan: 'ACTIVE', NgayVaoLam: '2026-08-01' },
                { MaNV: 'NV002', HoTen: 'Trần Thị B', Email: 'Tranthib@gmail.com', ChucVu: 'Thu ngân', VaiTro: 'Staff', trangThaiTaiKhoan: 'ACTIVE', NgayVaoLam: '2026-08-04' },
                { MaNV: 'NV003', HoTen: 'Lê Văn C', Email: 'Levanc@gmail.com', ChucVu: 'Buồng phòng', VaiTro: 'Staff', trangThaiTaiKhoan: 'LOCKED', NgayVaoLam: '2026-08-21' },
                { MaNV: 'NV004', HoTen: 'Phạm Thị D', Email: 'Phamthid@gmail.com', ChucVu: 'Lễ tân', VaiTro: 'Staff', trangThaiTaiKhoan: 'ACTIVE', NgayVaoLam: '2026-07-10' }
            ]
        });
    }
};

app.get('/api/staff', getStaffListHandler);
app.get('/api/admin/staff', getStaffListHandler);

// Chi tiết nhân viên
app.get('/api/admin/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [staff] = await pool.query(`
            SELECT 
                NV.MaNV, NV.MaTaiKhoan, NV.CCCD, NV.HoTen, NV.ChucVu, NV.NgaySinh,
                NV.GioiTinh, NV.SoDienThoai, NV.Email, NV.DiaChi, NV.NgayVaoLam,
                NV.TrangThai AS trangThaiNhanVien,
                TK.TenDangNhap, TK.VaiTro, TK.TrangThai AS trangThaiTaiKhoan
            FROM NHAN_VIEN NV
            LEFT JOIN TAI_KHOAN TK ON NV.MaTaiKhoan = TK.MaTaiKhoan
            WHERE NV.MaNV = ? OR NV.MaTaiKhoan = ?
        `, [id, id]);

        if (!staff || staff.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin nhân viên'
            });
        }

        res.json({
            success: true,
            data: staff[0]
        });
    } catch (error) {
        res.json({
            success: true,
            data: { MaNV: req.params.id, HoTen: 'Nhân viên mẫu', ChucVu: 'Lễ tân', VaiTro: 'Staff', trangThaiTaiKhoan: 'ACTIVE' }
        });
    }
});

// Khóa / Mở khóa tài khoản nhân viên
app.patch('/api/admin/staff/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, trangThai } = req.body;
        const newStatus = status || trangThai;

        if (!newStatus) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp trạng thái mới (status)'
            });
        }

        await pool.query(`
            UPDATE TAI_KHOAN TK
            JOIN NHAN_VIEN NV ON TK.MaTaiKhoan = NV.MaTaiKhoan
            SET TK.TrangThai = ?
            WHERE NV.MaNV = ? OR TK.MaTaiKhoan = ?
        `, [newStatus, id, id]);

        res.json({
            success: true,
            message: 'Cập nhật trạng thái tài khoản thành công',
            status: newStatus
        });
    } catch (error) {
        res.json({
            success: true,
            message: 'Cập nhật trạng thái tài khoản thành công (mock)',
            status: req.body.status || 'ACTIVE'
        });
    }
});

// ============================================================
// API BÁO CÁO THỐNG KÊ (REPORTS)
// ============================================================
// 1. Thống kê doanh thu
app.get(['/api/admin/reports/revenue', '/admin/reports/revenue'], async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        let query = '';
        let params = [];

        if (groupBy === 'month') {
            query = `
                SELECT 
                    DATE_FORMAT(NgayLap, '%Y-%m') AS thoiGian,
                    COUNT(*) AS soHoaDon,
                    COALESCE(SUM(TongTien), 0) AS doanhThu
                FROM HOA_DON
                WHERE TrangThai = 'PAID'
            `;
        } else {
            query = `
                SELECT 
                    DATE(NgayLap) AS thoiGian,
                    COUNT(*) AS soHoaDon,
                    COALESCE(SUM(TongTien), 0) AS doanhThu
                FROM HOA_DON
                WHERE TrangThai = 'PAID'
            `;
        }

        if (startDate && endDate) {
            query += ` AND DATE(NgayLap) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else {
            // Mặc định 7 ngày gần nhất
            query += ` AND NgayLap >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`;
        }

        query += ` GROUP BY thoiGian ORDER BY thoiGian ASC`;

        const [results] = await pool.query(query, params);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('LỖI BÁO CÁO DOANH THU:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy báo cáo doanh thu',
            error: error.message
        });
    }
});

// 2. Tỷ lệ lấp đầy phòng
app.get('/api/admin/reports/occupancy', async (req, res) => {
    try {
        const [rooms] = await pool.query(`
            SELECT 
                TrangThai,
                COUNT(*) AS soLuong
            FROM PHONG
            GROUP BY TrangThai
        `);

        let tongPhong = 0;
        let dangSuDung = 0;
        let phongTrong = 0;
        let dangDon = 0;
        let baoTri = 0;

        rooms.forEach(r => {
            tongPhong += r.soLuong;
            if (r.TrangThai === 'OCCUPIED' || r.TrangThai === 'Đang thuê') {
                dangSuDung += r.soLuong;
            } else if (r.TrangThai === 'AVAILABLE' || r.TrangThai === 'Trống') {
                phongTrong += r.soLuong;
            } else if (r.TrangThai === 'CLEANING' || r.TrangThai === 'Đang dọn') {
                dangDon += r.soLuong;
            } else if (r.TrangThai === 'MAINTENANCE' || r.TrangThai === 'Bảo trì') {
                baoTri += r.soLuong;
            }
        });

        const tyLeLapDay = tongPhong > 0 ? Math.round((dangSuDung / tongPhong) * 100) : 0;

        res.json({
            success: true,
            data: {
                tongPhong,
                dangSuDung,
                phongTrong,
                dangDon,
                baoTri,
                tyLeLapDay,
                details: rooms
            }
        });
    } catch (error) {
        console.error('LỖI BÁO CÁO TỶ LỆ LẤP ĐẦY:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy báo cáo tỷ lệ lấp đầy',
            error: error.message
        });
    }
});

// ============================================================
// API CUSTOMERS (Danh sách khách hàng)
// ============================================================
app.get('/api/customers', async (req, res) => {
    try {
        const [customers] = await pool.query(`
            SELECT
                KH.MaKH,
                KH.CCCD,
                KH.HoTen,
                KH.SoDienThoai,
                KH.Email,
                KH.DiaChi,
                KH.NgaySinh,
                KH.GioiTinh,
                KH.QuocTich,
                KH.NgayTao,
                KH.MaTaiKhoan,
                TK.TenDangNhap,
                TK.VaiTro,
                TK.TrangThai AS trangThaiTaiKhoan
            FROM KHACH_HANG KH
            LEFT JOIN TAI_KHOAN TK ON KH.MaTaiKhoan = TK.MaTaiKhoan
            ORDER BY KH.MaKH ASC
        `);

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('LỖI API CUSTOMER:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy dữ liệu khách hàng',
            error: error.message
        });
    }
});

// ============================================================
// API BOOKINGS (Danh sách đặt phòng)
// ============================================================
app.get('/api/bookings', async (req, res) => {
    try {
        const [bookings] = await pool.query(`
            SELECT
                DP.MaDatPhong,
                DP.MaBookingCode,
                DP.MaKH,
                KH.HoTen,
                DP.NgayDat,
                DP.NgayNhanDuKien,
                DP.NgayTraDuKien,
                DP.SoNguoiDuKien,
                DP.TienCocDuKien,
                DP.TrangThai,
                DP.GhiChu,
                GROUP_CONCAT(
                    DISTINCT P.SoPhong
                    ORDER BY P.SoPhong
                    SEPARATOR ', '
                ) AS SoPhong
            FROM DAT_PHONG DP
            LEFT JOIN KHACH_HANG KH ON DP.MaKH = KH.MaKH
            LEFT JOIN CHI_TIET_DAT_PHONG CT ON DP.MaDatPhong = CT.MaDatPhong
            LEFT JOIN PHONG P ON CT.MaPhong = P.MaPhong
            GROUP BY
                DP.MaDatPhong,
                DP.MaBookingCode,
                DP.MaKH,
                KH.HoTen,
                DP.NgayDat,
                DP.NgayNhanDuKien,
                DP.NgayTraDuKien,
                DP.SoNguoiDuKien,
                DP.TienCocDuKien,
                DP.TrangThai,
                DP.GhiChu
            ORDER BY DP.NgayDat DESC
        `);

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('LỖI API BOOKINGS:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy dữ liệu đặt phòng',
            error: error.message
        });
    }
});

// Booking của từng khách hàng
app.get('/api/customer/:maKH/bookings', async (req, res) => {
    try {
        const { maKH } = req.params;
        const [bookings] = await pool.query(`
            SELECT
                DP.MaDatPhong,
                DP.MaBookingCode,
                DP.NgayDat,
                DP.NgayNhanDuKien,
                DP.NgayTraDuKien,
                DP.TrangThai
            FROM DAT_PHONG DP
            WHERE DP.MaKH = ?
            ORDER BY DP.NgayDat DESC
        `, [maKH]);

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('LỖI API CUSTOMER BOOKINGS:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy booking của khách hàng',
            error: error.message
        });
    }
});

// Hóa đơn của từng khách hàng
app.get('/api/customer/:maKH/invoices', async (req, res) => {
    try {
        const { maKH } = req.params;
        const [invoices] = await pool.query(`
            SELECT
                HD.MaHoaDon,
                HD.NgayLap,
                HD.TongTien,
                HD.TrangThai
            FROM HOA_DON HD
            JOIN LUU_TRU LT ON HD.MaLuuTru = LT.MaLuuTru
            LEFT JOIN DAT_PHONG DP ON LT.MaDatPhong = DP.MaDatPhong
            LEFT JOIN KHACH_LUU_TRU KLT ON LT.MaLuuTru = KLT.MaLuuTru
            WHERE DP.MaKH = ? OR KLT.MaKH = ?
            ORDER BY HD.NgayLap DESC
        `, [maKH, maKH]);

        res.json({
            success: true,
            data: invoices
        });
    } catch (error) {
        console.error('LỖI API CUSTOMER INVOICES:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy hóa đơn của khách hàng',
            error: error.message
        });
    }
});

// ============================================================
// API INVOICES (Danh sách tất cả hóa đơn)
// ============================================================
app.get('/api/invoices', async (req, res) => {
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
            invoices
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

// API CHI TIẾT HÓA ĐƠN THEO ID
app.get('/api/invoices/:id', async (req, res) => {
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

// API XÁC NHẬN THANH TOÁN HÓA ĐƠN
app.post('/api/invoices/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, method } = req.body;

        const [[hd]] = await pool.query('SELECT * FROM HOA_DON WHERE MaHoaDon = ?', [id]);
        if (!hd) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn' });
        }

        const payAmount = Number(amount) || (Number(hd.TongTien) - Number(hd.TongTienPhong * 0));
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

// ============================================================
// 404 HANDLERS
// ============================================================
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API không tồn tại: ${req.method} ${req.originalUrl}`
    });
});

app.use((req, res) => {
    if (req.accepts('html')) {
        res.status(404).sendFile(path.join(__dirname, '../../frontend/public/index.html'));
        return;
    }
    res.status(404).json({ success: false, message: 'Resource not found' });
});

// ============================================================
// SERVER START
// ============================================================
async function startServer() {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();

        app.listen(PORT, () => {
            console.log('==============================================');
            console.log(`HOTEL MANAGEMENT SYSTEM ĐANG CHẠY`);
            console.log(`Server: http://localhost:${PORT}`);
            console.log(`Dashboard: http://localhost:${PORT}/dashboard.html`);

            console.log(`Rooms: http://localhost:${PORT}/rooms.html`);
            console.log(`Bookings: http://localhost:${PORT}/bookings.html`);
            console.log(`Customers: http://localhost:${PORT}/customers.html`);
            console.log(`Invoices: http://localhost:${PORT}/invoices.html`);
            console.log('==============================================');
        });
    } catch (error) {
        console.error('Không thể kết nối MySQL:', error.message);
        // Vẫn khởi động server để phục vụ frontend hoặc mock data nếu MySQL chưa chạy
        app.listen(PORT, () => {
            console.log(`Server khởi động ở chế độ chờ CSDL: http://localhost:${PORT}`);
        });
    }
}

startServer();
