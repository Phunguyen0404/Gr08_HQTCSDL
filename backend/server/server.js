// ============================================================
// HOTEL MANAGEMENT SYSTEM
// BACKEND SERVER
// ============================================================

const path = require('path');
<<<<<<< HEAD
=======


// ============================================================
// LOAD ENV
// ============================================================

>>>>>>> feature/admin
require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
});

<<<<<<< HEAD
=======

// ============================================================
// IMPORT
// ============================================================

>>>>>>> feature/admin
const express = require('express');
const cors = require('cors');
const pool = require('../config/db');
const roomRoutes = require('../routes/roomRoutes');
const bookingRoutes = require('../routes/bookingRoutes');
const customerRoutes = require('../routes/customerRoutes');


<<<<<<< HEAD
=======
// ============================================================
// DATABASE
// ============================================================

const pool = require('../config/db');


// ============================================================
// APP
// ============================================================

const app = express();

const PORT = process.env.PORT || 3000;


// ============================================================
// MIDDLEWARE
// ============================================================

>>>>>>> feature/admin
app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use('/css', express.static(path.join(__dirname, '../../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../../frontend/js')));
app.use('/assets', express.static(path.join(__dirname, '../../frontend/assets')));

<<<<<<< HEAD
app.use('/api/bookings', bookingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api', roomRoutes);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Hotel Management API đang chạy.'
    });
});

=======

// ============================================================
// FRONTEND
// ============================================================

// frontend/public
app.use(
    express.static(
        path.join(
            __dirname,
            '../../frontend/public'
        )
    )
);


// ============================================================
// JAVASCRIPT
// ============================================================

// frontend/js
app.use(
    '/js',
    express.static(
        path.join(
            __dirname,
            '../../frontend/js'
        )
    )
);


// ============================================================
// CSS
// ============================================================

// frontend/css
app.use(
    '/css',
    express.static(
        path.join(
            __dirname,
            '../../frontend/css'
        )
    )
);


// ============================================================
// HOME
// ============================================================

app.get('/', (req, res) => {

    res.redirect('/dashboard.html');

});


// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', async (req, res) => {

    try {

        await pool.query('SELECT 1');

        res.json({

            success: true,

            message:
                'Server + MySQL hoạt động bình thường'

        });

    }

    catch (error) {

        console.error(
            'LỖI HEALTH CHECK:',
            error
        );

        res.status(500).json({

            success: false,

            message:
                'Không kết nối được MySQL',

            error:
                error.message

        });

    }

});


// ============================================================
// API DASHBOARD
// ============================================================

>>>>>>> feature/admin
app.get('/api/dashboard', async (req, res) => {

    try {
<<<<<<< HEAD
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
=======

        // ----------------------------------------------------
        // 1. DOANH THU HÔM NAY
        // ----------------------------------------------------

        const [revenueToday] =
            await pool.query(`

                SELECT

                    COALESCE(
                        SUM(TongTien),
                        0
                    ) AS doanhThuHomNay

                FROM HOA_DON

                WHERE TrangThai = 'PAID'

                AND DATE(NgayLap) = CURDATE()

            `);


        // ----------------------------------------------------
        // 2. DOANH THU THÁNG
        // ----------------------------------------------------

        const [revenueMonth] =
            await pool.query(`

                SELECT

                    COALESCE(
                        SUM(TongTien),
                        0
                    ) AS doanhThuThang

                FROM HOA_DON

                WHERE TrangThai = 'PAID'

                AND YEAR(NgayLap)
                    = YEAR(CURDATE())

                AND MONTH(NgayLap)
                    = MONTH(CURDATE())

            `);


        // ----------------------------------------------------
        // 3. TRẠNG THÁI PHÒNG
        // ----------------------------------------------------

        const [rooms] =
            await pool.query(`

                SELECT

                    TrangThai,

                    COUNT(*) AS soLuong

                FROM PHONG

                GROUP BY TrangThai

            `);


        // ----------------------------------------------------
        // 4. TỶ LỆ LẤP ĐẦY
        // ----------------------------------------------------

        const [occupancy] =
            await pool.query(`

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


        const tongPhong =
            Number(
                occupancy[0]?.tongPhong || 0
            );


        const phongDangSuDung =
            Number(
                occupancy[0]?.phongDangSuDung || 0
            );


        const tyLeLapDay =
            tongPhong > 0

                ? Number(

                    (
                        phongDangSuDung
                        /
                        tongPhong
                        *
                        100

                    ).toFixed(2)

                )

                : 0;


        // ----------------------------------------------------
        // 5. NHÂN VIÊN
        // ----------------------------------------------------

        const [staff] =
            await pool.query(`

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

                LEFT JOIN TAI_KHOAN TK

                    ON NV.MaTaiKhoan =
                       TK.MaTaiKhoan

            `);


        // ----------------------------------------------------
        // 6. BOOKING
        // ----------------------------------------------------

        const [bookingCount] =
            await pool.query(`

                SELECT

                    COUNT(*) AS soBooking

                FROM DAT_PHONG

            `);


        // ----------------------------------------------------
        // 7. DOANH THU 7 NGÀY
        // ----------------------------------------------------

        const [revenueChart] =
            await pool.query(`

                SELECT

                    DATE(NgayLap) AS ngay,

                    COALESCE(
                        SUM(TongTien),
                        0
                    ) AS doanhThu

                FROM HOA_DON

                WHERE TrangThai = 'PAID'

                AND NgayLap >= DATE_SUB(

                    CURDATE(),

                    INTERVAL 6 DAY

                )

                GROUP BY
                    DATE(NgayLap)

                ORDER BY
                    DATE(NgayLap) ASC

            `);


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------
>>>>>>> feature/admin

        res.json({

            success: true,
<<<<<<< HEAD
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
=======


            revenue: {

                doanhThuHomNay:
                    Number(
                        revenueToday[0]
                            ?.doanhThuHomNay || 0
                    ),

                doanhThuThang:
                    Number(
                        revenueMonth[0]
                            ?.doanhThuThang || 0
                    )

            },


            rooms: rooms,


            occupancy: {

                tongPhong:
                    tongPhong,

                phongDangSuDung:
                    phongDangSuDung,

                tyLeLapDay:
                    tyLeLapDay

            },


            staff: {

                tongNhanVien:
                    Number(
                        staff[0]
                            ?.tongNhanVien || 0
                    ),

                dangHoatDong:
                    Number(
                        staff[0]
                            ?.dangHoatDong || 0
                    )

            },


            bookings: {

                soBooking:
                    Number(
                        bookingCount[0]
                            ?.soBooking || 0
                    )

            },


            revenueChart:
                revenueChart

        });

    }

    catch (error) {

        console.error(
            'LỖI API DASHBOARD:',
            error
        );


>>>>>>> feature/admin
        res.status(500).json({

            success: false,

            message:
                'Không thể lấy dữ liệu Dashboard',

            error:
                error.message

        });

    }

});

<<<<<<< HEAD
=======

// ============================================================
// API STAFF
// ============================================================

>>>>>>> feature/admin
app.get('/api/staff', async (req, res) => {

    try {
<<<<<<< HEAD
        const [staffList] = await pool.query(`
            SELECT NV.MaNV, NV.HoTen, NV.Email, NV.SoDienThoai, NV.ChucVu, NV.NgayVaoLam,
                   NV.TrangThai AS trangThaiNhanVien,
                   TK.VaiTro, TK.TrangThai AS trangThaiTaiKhoan
            FROM NHAN_VIEN NV
            JOIN TAI_KHOAN TK ON NV.MaTaiKhoan = TK.MaTaiKhoan
            ORDER BY NV.MaNV
        `);
=======

        const [staffList] =
            await pool.query(`

                SELECT

                    NV.MaNV,

                    NV.MaTaiKhoan,

                    NV.CCCD,

                    NV.HoTen,

                    NV.ChucVu,

                    NV.NgaySinh,

                    NV.NgayVaoLam,

                    NV.TrangThai
                        AS trangThaiNhanVien,

                    TK.TenDangNhap,

                    TK.VaiTro,

                    TK.TrangThai
                        AS trangThaiTaiKhoan

                FROM NHAN_VIEN NV

                LEFT JOIN TAI_KHOAN TK

                    ON NV.MaTaiKhoan =
                       TK.MaTaiKhoan

                ORDER BY

                    NV.MaNV ASC

            `);


        console.log(
            '>>> STAFF LIST:',
            staffList
        );

>>>>>>> feature/admin

        res.json({

            success: true,

            data:
                staffList

        });
<<<<<<< HEAD
    } catch (error) {
        console.error('LỖI API STAFF:', error);
=======

    }

    catch (error) {

        console.error(
            '================================================'
        );

        console.error(
            'LỖI API STAFF:',
            error
        );

        console.error(
            '================================================'
        );


>>>>>>> feature/admin
        res.status(500).json({

            success: false,

            message:
                'Không thể lấy dữ liệu nhân viên',

            error:
                error.message

        });

    }

});

<<<<<<< HEAD
app.listen(PORT, () => {
    console.log(`Server dang chay tai http://localhost:${PORT}`);
});
=======

// ============================================================
// API CUSTOMER
// ============================================================

app.get('/api/customers', async (req, res) => {

    try {

        const [customers] =
            await pool.query(`

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

                    TK.TrangThai
                        AS trangThaiTaiKhoan

                FROM KHACH_HANG KH

                LEFT JOIN TAI_KHOAN TK

                    ON KH.MaTaiKhoan =
                       TK.MaTaiKhoan

                ORDER BY
                    KH.MaKH ASC

            `);


        res.json({

            success: true,

            data:
                customers

        });

    }

    catch (error) {

        console.error(
            'LỖI API CUSTOMER:',
            error
        );


        res.status(500).json({

            success: false,

            message:
                'Không thể lấy dữ liệu khách hàng',

            error:
                error.message

        });

    }

});


// ============================================================
// API BOOKINGS
// ============================================================

app.get('/api/bookings', async (req, res) => {

    try {

        const [bookings] =
            await pool.query(`

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

                LEFT JOIN KHACH_HANG KH

                    ON DP.MaKH =
                       KH.MaKH

                LEFT JOIN CHI_TIET_DAT_PHONG CT

                    ON DP.MaDatPhong =
                       CT.MaDatPhong

                LEFT JOIN PHONG P

                    ON CT.MaPhong =
                       P.MaPhong

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

                ORDER BY

                    DP.NgayDat DESC

            `);


        res.json({

            success: true,

            bookings:
                bookings

        });

    }

    catch (error) {

        console.error(
            'LỖI API BOOKING:',
            error
        );


        res.status(500).json({

            success: false,

            message:
                'Không thể lấy dữ liệu đặt phòng',

            error:
                error.message

        });

    }

});


// ============================================================
// API BOOKING CỦA KHÁCH HÀNG
// ============================================================

app.get(
    '/api/customer/:maKH/bookings',
    async (req, res) => {

        try {

            const {
                maKH
            } = req.params;


            const [bookings] =
                await pool.query(`

                    SELECT

                        DP.MaDatPhong,

                        DP.MaBookingCode,

                        DP.NgayDat,

                        DP.NgayNhanDuKien,

                        DP.NgayTraDuKien,

                        DP.SoNguoiDuKien,

                        DP.TienCocDuKien,

                        DP.TrangThai,

                        DP.GhiChu,

                        P.MaPhong,

                        P.SoPhong,

                        LP.MaLoaiPhong,

                        LP.TenLoaiPhong,

                        CT.DonGiaDat,

                        CT.GhiChuChiTiet

                    FROM DAT_PHONG DP

                    JOIN CHI_TIET_DAT_PHONG CT

                        ON DP.MaDatPhong =
                           CT.MaDatPhong

                    JOIN PHONG P

                        ON CT.MaPhong =
                           P.MaPhong

                    JOIN LOAI_PHONG LP

                        ON P.MaLoaiPhong =
                           LP.MaLoaiPhong

                    WHERE DP.MaKH = ?

                    ORDER BY

                        DP.NgayDat DESC

                `,

                [maKH]

            );


            res.json({

                success: true,

                maKH:
                    maKH,

                bookings:
                    bookings

            });

        }

        catch (error) {

            console.error(
                'LỖI API CUSTOMER BOOKING:',
                error
            );


            res.status(500).json({

                success: false,

                message:
                    'Không thể lấy lịch sử đặt phòng',

                error:
                    error.message

            });

        }

    }

);


// ============================================================
// API HÓA ĐƠN CỦA KHÁCH HÀNG
// ============================================================

app.get(
    '/api/customer/:maKH/invoices',
    async (req, res) => {

        try {

            const {
                maKH
            } = req.params;


            const [invoices] =
                await pool.query(`

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

                        DP.MaBookingCode,

                        COALESCE(

                            SUM(

                                CASE

                                    WHEN TT.TrangThai =
                                        'COMPLETED'

                                    THEN TT.SoTien

                                    ELSE 0

                                END

                            ),

                            0

                        ) AS DaThanhToan

                    FROM HOA_DON HD

                    JOIN LUU_TRU LT

                        ON HD.MaLuuTru =
                           LT.MaLuuTru

                    JOIN DAT_PHONG DP

                        ON LT.MaDatPhong =
                           DP.MaDatPhong

                    LEFT JOIN THANH_TOAN TT

                        ON HD.MaHoaDon =
                           TT.MaHoaDon

                    WHERE DP.MaKH = ?

                    GROUP BY

                        HD.MaHoaDon,

                        HD.MaLuuTru,

                        HD.NgayLap,

                        HD.TongTienPhong,

                        HD.Thue,

                        HD.GiamGia,

                        HD.TongTien,

                        HD.TrangThai,

                        HD.GhiChuHoaDon,

                        DP.MaBookingCode

                    ORDER BY

                        HD.NgayLap DESC

                `,

                [maKH]

            );


            res.json({

                success: true,

                maKH:
                    maKH,

                invoices:
                    invoices

            });

        }

        catch (error) {

            console.error(
                'LỖI API CUSTOMER INVOICE:',
                error
            );


            res.status(500).json({

                success: false,

                message:
                    'Không thể lấy dữ liệu hóa đơn',

                error:
                    error.message

            });

        }

    }

);


// ============================================================
// API TẤT CẢ HÓA ĐƠN
// ============================================================

app.get('/api/invoices', async (req, res) => {

    try {

        const [invoices] =
            await pool.query(`

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


                    /* ======================================
                       KHÁCH HÀNG
                       ====================================== */

                    COALESCE(

                        KH.HoTen,

                        KH_BOOKER.HoTen,

                        'Khách vãng lai'

                    ) AS HoTen,


                    /* ======================================
                       MÃ KHÁCH HÀNG
                       ====================================== */

                    COALESCE(

                        KH.MaKH,

                        KH_BOOKER.MaKH

                    ) AS MaKH,


                    /* ======================================
                       BOOKING
                       ====================================== */

                    DP.MaBookingCode,


                    /* ======================================
                       ĐÃ THANH TOÁN
                       ====================================== */

                    COALESCE(

                        (

                            SELECT
                                SUM(TT.SoTien)

                            FROM THANH_TOAN TT

                            WHERE
                                TT.MaHoaDon =
                                HD.MaHoaDon

                            AND TT.TrangThai =
                                'COMPLETED'

                        ),

                        0

                    ) AS DaThanhToan


                FROM HOA_DON HD


                /* ======================================
                   HÓA ĐƠN → LƯU TRÚ
                   ====================================== */

                JOIN LUU_TRU LT

                    ON HD.MaLuuTru =
                       LT.MaLuuTru


                /* ======================================
                   LƯU TRÚ → ĐẶT PHÒNG
                   ====================================== */

                LEFT JOIN DAT_PHONG DP

                    ON LT.MaDatPhong =
                       DP.MaDatPhong


                /* ======================================
                   ĐẶT PHÒNG → KHÁCH HÀNG
                   ====================================== */

                LEFT JOIN KHACH_HANG KH

                    ON DP.MaKH =
                       KH.MaKH


                /* ======================================
                   WALK-IN
                   ====================================== */

                LEFT JOIN KHACH_LUU_TRU KLT

                    ON LT.MaLuuTru =
                       KLT.MaLuuTru

                    AND KLT.VaiTro =
                        'BOOKER'


                /* ======================================
                   WALK-IN → KHÁCH HÀNG
                   ====================================== */

                LEFT JOIN KHACH_HANG KH_BOOKER

                    ON KLT.MaKH =
                       KH_BOOKER.MaKH


                /* ======================================
                   SẮP XẾP
                   ====================================== */

                ORDER BY

                    HD.NgayLap DESC

            `);


        console.log(
            '>>> INVOICE LIST:',
            invoices
        );


        res.json({

            success: true,

            invoices:
                invoices

        });

    }

    catch (error) {

        console.error(
            '================================================'
        );

        console.error(
            'LỖI API INVOICES:',
            error
        );

        console.error(
            '================================================'
        );


        res.status(500).json({

            success: false,

            message:
                'Không thể lấy dữ liệu hóa đơn',

            error:
                error.message

        });

    }

});


// ============================================================
// API 404
// ============================================================

app.use('/api', (req, res) => {

    res.status(404).json({

        success: false,

        message:
            `API không tồn tại: ${req.method} ${req.originalUrl}`

    });

});


// ============================================================
// PAGE 404
// ============================================================

app.use((req, res) => {

    res.status(404).send(`

        <!DOCTYPE html>

        <html lang="vi">

        <head>

            <meta charset="UTF-8">

            <title>404</title>

        </head>

        <body>

            <h1>
                404 - Không tìm thấy trang
            </h1>

            <p>
                ${req.originalUrl}
            </p>

        </body>

        </html>

    `);

});


// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    () => {

        console.log('');

        console.log(
            '=============================================='
        );

        console.log(
            ' HOTEL MANAGEMENT SYSTEM'
        );

        console.log(
            '=============================================='
        );

        console.log(
            `Server:
http://localhost:${PORT}`
        );

        console.log(
            `Dashboard:
http://localhost:${PORT}/dashboard.html`
        );

        console.log(
            `Bookings:
http://localhost:${PORT}/bookings.html`
        );

        console.log(
            `Customers:
http://localhost:${PORT}/customers.html`
        );

        console.log(
            `Staff:
http://localhost:${PORT}/staff.html`
        );

        console.log(
            `Invoices:
http://localhost:${PORT}/invoices.html`
        );

        console.log(
            `Invoice API:
http://localhost:${PORT}/api/invoices`
        );

        console.log(
            `Customer API:
http://localhost:${PORT}/api/customers`
        );

        console.log(
            `Booking API:
http://localhost:${PORT}/api/bookings`
        );

        console.log(
            `Staff API:
http://localhost:${PORT}/api/staff`
        );

        console.log(
            `Dashboard API:
http://localhost:${PORT}/api/dashboard`
        );

        console.log(
            `Health:
http://localhost:${PORT}/api/health`
        );

        console.log(
            '=============================================='
        );

        console.log('');

    }
);
>>>>>>> feature/admin
