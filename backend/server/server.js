const path = require('path');

// ============================================================
// LOAD .ENV
// ============================================================

require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
});

console.log('>>> SERVER.JS DANG CHAY <<<');

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log(
    'DB_PASSWORD:',
    process.env.DB_PASSWORD ? 'DA CO' : 'DANG TRONG'
);


// ============================================================
// IMPORT
// ============================================================

const express = require('express');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;


// ============================================================
// KẾT NỐI MYSQL
// ============================================================

const pool = require('../config/db');


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());


// ============================================================
// SERVE FRONTEND
// ============================================================

app.use(
    express.static(
        path.join(
            __dirname,
            '../../frontend/public'
        )
    )
);


// ============================================================
// SERVE JAVASCRIPT
// ============================================================

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

        // ====================================================
        // 1. DOANH THU HÔM NAY
        // ====================================================

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


        // ====================================================
        // 2. DOANH THU THÁNG NÀY
        // ====================================================

        const [revenueMonth] =
            await pool.query(`

                SELECT
                    COALESCE(
                        SUM(TongTien),
                        0
                    ) AS doanhThuThang

                FROM HOA_DON

                WHERE TrangThai = 'PAID'

                AND YEAR(NgayLap) =
                    YEAR(CURDATE())

                AND MONTH(NgayLap) =
                    MONTH(CURDATE())

            `);


        // ====================================================
        // 3. THỐNG KÊ TRẠNG THÁI PHÒNG
        // ====================================================

        const [rooms] =
            await pool.query(`

                SELECT
                    TrangThai,
                    COUNT(*) AS soLuong

                FROM PHONG

                GROUP BY TrangThai

            `);


        // ====================================================
        // 4. TỶ LỆ LẤP ĐẦY
        // ====================================================

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
                occupancy[0].tongPhong || 0
            );


        const phongDangSuDung =
            Number(
                occupancy[0].phongDangSuDung || 0
            );


        const tyLeLapDay =
            tongPhong > 0
                ? Number(
                    (
                        (
                            phongDangSuDung /
                            tongPhong
                        ) * 100
                    ).toFixed(2)
                )
                : 0;


        // ====================================================
        // 5. THỐNG KÊ NHÂN VIÊN
        // ====================================================

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


        // ====================================================
        // 6. DANH SÁCH NHÂN VIÊN
        // ====================================================

        const [staffList] =
            await pool.query(`

                SELECT

                    NV.MaNV,

                    NV.MaTaiKhoan,

                    NV.CCCD,

                    NV.HoTen,

                    NV.NgaySinh,

                    NV.GioiTinh,

                    NV.SoDienThoai,

                    NV.Email,

                    NV.DiaChi,

                    NV.ChucVu,

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

                ORDER BY NV.MaNV

            `);


        // ====================================================
        // 7. DOANH THU THEO NGÀY
        // ====================================================

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

                GROUP BY
                    DATE(NgayLap)

                ORDER BY
                    DATE(NgayLap) DESC

                LIMIT 7

            `);


        // ====================================================
        // 8. TỔNG SỐ BOOKING
        // ====================================================

        const [bookings] =
            await pool.query(`

                SELECT
                    COUNT(*) AS soBooking

                FROM DAT_PHONG

            `);


        // ====================================================
        // 9. TRẢ DỮ LIỆU DASHBOARD
        // ====================================================

        res.json({

            success: true,

            revenue: {

                doanhThuHomNay:
                    revenueToday[0]
                        .doanhThuHomNay,

                doanhThuThang:
                    revenueMonth[0]
                        .doanhThuThang

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
                            .tongNhanVien || 0
                    ),

                dangHoatDong:
                    Number(
                        staff[0]
                            .dangHoatDong || 0
                    )

            },

            staffList: staffList,

            bookings: {

                soBooking:
                    Number(
                        bookings[0]
                            .soBooking || 0
                    )

            },

            revenueChart:
                revenueChart.reverse()

        });


    } catch (error) {

        console.error(
            'LỖI API DASHBOARD:',
            error
        );


        res.status(500).json({

            success: false,

            message:
                'Không thể lấy dữ liệu Dashboard',

            error:
                error.message

        });

    }

});


// ============================================================
// API STAFF
// ============================================================

app.get('/api/staff', async (req, res) => {

    try {

        // ====================================================
        // LẤY DANH SÁCH  NHÂN VIÊN
        // ====================================================

        const [staffList] =
            await pool.query(`

                SELECT

                    NV.MaNV,

                    NV.MaTaiKhoan,

                    NV.CCCD,

                    NV.HoTen,

                    NV.NgaySinh,

                    NV.GioiTinh,

                    NV.SoDienThoai,

                    NV.Email,

                    NV.DiaChi,

                    NV.ChucVu,

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

                ORDER BY NV.MaNV

            `);


        // ====================================================
        // KIỂM TRA DỮ LIỆU TRẢ VỀ
        // ====================================================

        console.log(
            '>>> STAFF LIST:',
            staffList
        );


        // ====================================================
        // TRẢ JSON
        // ====================================================

        res.json({

            success: true,

            data: staffList

        });


    } catch (error) {

        console.error(
            'LỖI API STAFF:',
            error
        );


        res.status(500).json({

            success: false,

            message:
                'Không thể lấy dữ liệu nhân viên',

            error:
                error.message

        });

    }

});


// ============================================================
// API LẤY TOÀN BỘ BOOKING
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

                JOIN KHACH_HANG KH

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

            bookings: bookings

        });


    } catch (error) {

        console.error(
            'LỖI API LẤY TOÀN BỘ BOOKING:',
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

});


// ============================================================
// API LỊCH SỬ ĐẶT PHÒNG CUSTOMER
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

                `, [maKH]);


            res.json({

                success: true,

                maKH: maKH,

                bookings: bookings

            });


        } catch (error) {

            console.error(
                'LỖI API LỊCH SỬ ĐẶT PHÒNG:',
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
// API HÓA ĐƠN CUSTOMER
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

                `, [maKH]);


            res.json({

                success: true,

                maKH: maKH,

                invoices: invoices

            });


        } catch (error) {

            console.error(
                'LỖI API HÓA ĐƠN CUSTOMER:',
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
// API LẤY TOÀN BỘ HÓA ĐƠN
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

                LEFT JOIN DAT_PHONG DP

                ON LT.MaDatPhong =
                    DP.MaDatPhong

                LEFT JOIN THANH_TOAN TT

                ON HD.MaHoaDon =
                    TT.MaHoaDon

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

            `);


        res.json({

            success: true,

            invoices: invoices

        });


    } catch (error) {

        console.error(
            'LỖI API LẤY TOÀN BỘ HÓA ĐƠN:',
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

});


// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    () => {

        console.log(
            `Server dang chay tai http://localhost:${PORT}`
        );

    }
);