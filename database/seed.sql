-- ============================================================
-- HOTEL MANAGEMENT SYSTEM
-- SEED DATA
-- DBMS: MySQL 9.3.0
-- ============================================================

USE hotel_management;

START TRANSACTION;


-- ============================================================
-- 1. TAI_KHOAN
-- ============================================================

INSERT INTO TAI_KHOAN
(
    MaTaiKhoan,
    TenDangNhap,
    MatKhauHash,
    VaiTro,
    TrangThai
)
VALUES
(
    'TK001',
    'admin001',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    'ACTIVE'
),
(
    'TK002',
    'staff001',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'STAFF',
    'ACTIVE'
),
(
    'TK003',
    'staff002',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'STAFF',
    'ACTIVE'
),
(
    'TK004',
    'customer01',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'CUSTOMER',
    'ACTIVE'
),
(
    'TK005',
    'customer02',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'CUSTOMER',
    'ACTIVE'
);


-- ============================================================
-- 2. KHACH_HANG
-- ============================================================

INSERT INTO KHACH_HANG
(
    MaKH,
    CCCD,
    HoTen,
    SoDienThoai,
    Email,
    DiaChi,
    NgaySinh,
    GioiTinh,
    QuocTich,
    NgayTao,
    MaTaiKhoan
)
VALUES
(
    'KH001',
    '001203000001',
    'Nguyen Van An',
    '0901000001',
    'an.nguyen@example.com',
    'Ha Noi',
    '2000-03-15',
    'MALE',
    'Viet Nam',
    '2026-08-01 09:00:00',
    'TK004'
),
(
    'KH002',
    '001203000002',
    'Tran Thi Binh',
    '0901000002',
    'binh.tran@example.com',
    'Hai Phong',
    '1999-07-21',
    'FEMALE',
    'Viet Nam',
    '2026-08-02 10:00:00',
    'TK005'
),
(
    'KH003',
    '001203000003',
    'Le Minh Chau',
    '0901000003',
    'chau.le@example.com',
    'Da Nang',
    '1998-11-08',
    'FEMALE',
    'Viet Nam',
    '2026-08-03 11:00:00',
    NULL
),
(
    'KH004',
    '001203000004',
    'Pham Duc Long',
    '0901000004',
    NULL,
    'Ho Chi Minh City',
    '1995-05-12',
    'MALE',
    'Viet Nam',
    '2026-08-04 14:00:00',
    NULL
);


-- ============================================================
-- 3. NHAN_VIEN
-- ============================================================

INSERT INTO NHAN_VIEN
(
    MaTaiKhoan,
    MaNV,
    CCCD,
    HoTen,
    ChucVu,
    TrangThai,
    NgaySinh,
    GioiTinh,
    SoDienThoai,
    Email,
    DiaChi,
    NgayVaoLam
)
VALUES
(
    'TK001',
    'NV001',
    '001203100001',
    'Nguyen Thi Lan',
    'Quan ly',
    'ACTIVE',
    '1990-02-10',
    'FEMALE',
    '0902000001',
    'lan.nguyen@hotel.com',
    'Ha Noi',
    '2023-01-10'
),
(
    'TK002',
    'NV002',
    '001203100002',
    'Tran Van Minh',
    'Le tan',
    'ACTIVE',
    '1995-06-18',
    'MALE',
    '0902000002',
    'minh.tran@hotel.com',
    'Ha Noi',
    '2024-03-15'
),
(
    'TK003',
    'NV003',
    '001203100003',
    'Le Thi Hoa',
    'Le tan',
    'ACTIVE',
    '1996-09-25',
    'FEMALE',
    '0902000003',
    'hoa.le@hotel.com',
    'Ha Noi',
    '2024-06-01'
);


-- ============================================================
-- 4. LOAI_PHONG
-- ============================================================

INSERT INTO LOAI_PHONG
(
    MaLoaiPhong,
    TenLoaiPhong,
    SucChua,
    GiaCoBan,
    MoTa,
    TrangThai
)
VALUES
(
    'LP001',
    'Standard',
    2,
    600000.00,
    'Phong tieu chuan 1 giuong',
    'ACTIVE'
),
(
    'LP002',
    'Deluxe',
    2,
    900000.00,
    'Phong cao cap 1 giuong',
    'ACTIVE'
),
(
    'LP003',
    'Family',
    4,
    1400000.00,
    'Phong gia dinh 2 giuong',
    'ACTIVE'
),
(
    'LP004',
    'Suite',
    3,
    2000000.00,
    'Phong Suite cao cap',
    'ACTIVE'
);


-- ============================================================
-- 5. PHONG
-- ============================================================

INSERT INTO PHONG
(
    MaPhong,
    SoPhong,
    MaLoaiPhong,
    Tang,
    TrangThai,
    MoTa
)
VALUES
(
    'P101',
    '101',
    'LP001',
    1,
    'AVAILABLE',
    'Phong Standard tang 1'
),
(
    'P102',
    '102',
    'LP001',
    1,
    'OCCUPIED',
    'Phong Standard dang co khach walk-in'
),
(
    'P103',
    '103',
    'LP001',
    1,
    'CLEANING',
    'Phong dang don dep'
),
(
    'P201',
    '201',
    'LP002',
    2,
    'AVAILABLE',
    'Phong Deluxe tang 2'
),
(
    'P202',
    '202',
    'LP002',
    2,
    'AVAILABLE',
    'Phong Deluxe tang 2'
),
(
    'P301',
    '301',
    'LP003',
    3,
    'AVAILABLE',
    'Phong Family tang 3'
),
(
    'P302',
    '302',
    'LP003',
    3,
    'AVAILABLE',
    'Phong Family tang 3'
),
(
    'P401',
    '401',
    'LP004',
    4,
    'AVAILABLE',
    'Phong Suite tang 4'
),
(
    'P402',
    '402',
    'LP004',
    4,
    'MAINTENANCE',
    'Phong dang bao tri'
);


-- ============================================================
-- 6. DAT_PHONG
-- ============================================================

-- DP001:
-- Booking online cua KH001
-- MaNV_Tao = NULL

-- DP002:
-- Booking do Staff NV002 tao cho KH002

INSERT INTO DAT_PHONG
(
    MaDatPhong,
    MaBookingCode,
    MaKH,
    MaNV_Tao,
    NgayDat,
    NgayNhanDuKien,
    NgayTraDuKien,
    SoNguoiDuKien,
    TienCocDuKien,
    TrangThai,
    GhiChu
)
VALUES
(
    'DP001',
    'BK20260820001',
    'KH001',
    NULL,
    '2026-08-18 09:30:00',
    '2026-08-20 14:00:00',
    '2026-08-22 12:00:00',
    2,
    600000.00,
    'COMPLETED',
    'Booking online'
),
(
    'DP002',
    'BK20260821001',
    'KH002',
    'NV002',
    '2026-08-19 10:15:00',
    '2026-08-20 14:00:00',
    '2026-08-23 12:00:00',
    2,
    900000.00,
    'COMPLETED',
    'Booking do staff tao tai quay'
),
(
    'DP003',
    'BK20260823001',
    'KH003',
    NULL,
    '2026-08-23 16:20:00',
    '2026-09-01 14:00:00',
    '2026-09-03 12:00:00',
    2,
    0.00,
    'CONFIRMED',
    'Booking sap toi'
);


-- ============================================================
-- 7. CHI_TIET_DAT_PHONG
-- ============================================================

INSERT INTO CHI_TIET_DAT_PHONG
(
    MaDatPhong,
    MaPhong,
    DonGiaDat,
    GhiChuChiTiet
)
VALUES
(
    'DP001',
    'P201',
    900000.00,
    'Phong Deluxe'
),
(
    'DP002',
    'P301',
    1400000.00,
    'Phong Family'
),
(
    'DP003',
    'P401',
    2000000.00,
    'Phong Suite'
);


-- ============================================================
-- 8. LUU_TRU
-- ============================================================

-- LT001: Stay tu DP001
-- LT002: Stay tu DP002
-- LT003: WALK-IN, khong co DAT_PHONG

INSERT INTO LUU_TRU
(
    MaLuuTru,
    MaDatPhong,
    CheckInAt,
    CheckOutDuKien,
    CheckOutAt,
    TrangThai,
    GhiChuLuuTru
)
VALUES
(
    'LT001',
    'DP001',
    '2026-08-20 14:05:00',
    '2026-08-22 12:00:00',
    '2026-08-22 11:45:00',
    'CHECKED_OUT',
    'Stay tu booking online'
),
(
    'LT002',
    'DP002',
    '2026-08-20 14:10:00',
    '2026-08-23 12:00:00',
    '2026-08-23 11:30:00',
    'CHECKED_OUT',
    'Stay tu booking do staff tao'
),
(
    'LT003',
    NULL,
    '2026-08-23 15:00:00',
    '2026-08-25 12:00:00',
    NULL,
    'IN_HOUSE',
    'WALK-IN - khach den truc tiep'
);


-- ============================================================
-- 9. KHACH_LUU_TRU
-- ============================================================

INSERT INTO KHACH_LUU_TRU
(
    MaLuuTru,
    MaKH,
    VaiTro,
    GhiChu
)
VALUES
(
    'LT001',
    'KH001',
    'BOOKER',
    'Khach dat phong'
),
(
    'LT001',
    'KH004',
    'GUEST',
    'Khach di cung'
),
(
    'LT002',
    'KH002',
    'BOOKER',
    'Khach dat phong'
),
(
    'LT002',
    'KH003',
    'GUEST',
    'Khach di cung'
),
(
    'LT003',
    'KH004',
    'BOOKER',
    'Khach walk-in'
);


-- ============================================================
-- 10. PHAN_PHONG
-- ============================================================

INSERT INTO PHAN_PHONG
(
    MaPhanPhong,
    MaLuuTru,
    MaPhong,
    ThoiGianBatDau,
    ThoiGianKetThuc,
    LyDo,
    GhiChu
)
VALUES
(
    'PP001',
    'LT001',
    'P201',
    '2026-08-20 14:05:00',
    '2026-08-22 11:45:00',
    'Check-in',
    'Phan phong ban dau'
),
(
    'PP002',
    'LT002',
    'P301',
    '2026-08-20 14:10:00',
    '2026-08-23 11:30:00',
    'Check-in',
    'Phan phong ban dau'
),
(
    'PP003',
    'LT003',
    'P102',
    '2026-08-23 15:00:00',
    NULL,
    'Walk-in check-in',
    'Khach den truc tiep khong co booking'
);


-- ============================================================
-- 11. HOA_DON
-- ============================================================

-- HD001:
-- 2 nights x 900,000 = 1,800,000
-- Tax = 180,000
-- Total = 1,980,000

-- HD002:
-- 3 nights x 1,400,000 = 4,200,000
-- Tax = 420,000
-- Discount = 200,000
-- Total = 4,420,000

-- HD003:
-- Walk-in: 2 nights x 600,000 = 1,200,000
-- Tax = 120,000
-- Total = 1,320,000

INSERT INTO HOA_DON
(
    MaHoaDon,
    MaLuuTru,
    NgayLap,
    TongTienPhong,
    Thue,
    GiamGia,
    TongTien,
    TrangThai,
    GhiChuHoaDon
)
VALUES
(
    'HD001',
    'LT001',
    '2026-08-22 11:30:00',
    1800000.00,
    180000.00,
    0.00,
    1980000.00,
    'PAID',
    'Hoa don booking DP001'
),
(
    'HD002',
    'LT002',
    '2026-08-23 11:15:00',
    4200000.00,
    420000.00,
    200000.00,
    4420000.00,
    'PAID',
    'Hoa don booking DP002'
),
(
    'HD003',
    'LT003',
    '2026-08-23 18:00:00',
    1200000.00,
    120000.00,
    0.00,
    1320000.00,
    'ISSUED',
    'Hoa don WALK-IN'
);


-- ============================================================
-- 12. THANH_TOAN
-- ============================================================

-- TT001:
-- Tien coc DP001, truoc khi co hoa don.

-- TT002:
-- Thanh toan phan con lai cua HD001.

-- TT003:
-- Tien coc DP002.

-- Luu y:
-- WALK-IN LT003 chua co payment trong seed nay
-- vi THANH_TOAN.MaDatPhong dang NOT NULL trong schema.

INSERT INTO THANH_TOAN
(
    MaThanhToan,
    MaDatPhong,
    MaHoaDon,
    NgayThanhToan,
    SoTien,
    PhuongThuc,
    TrangThai,
    GhiChuThanhToan
)
VALUES
(
    'TT001',
    'DP001',
    NULL,
    '2026-08-18 09:35:00',
    600000.00,
    'TRANSFER',
    'COMPLETED',
    'Tien coc booking DP001'
),
(
    'TT002',
    'DP001',
    'HD001',
    '2026-08-22 11:40:00',
    1380000.00,
    'CARD',
    'COMPLETED',
    'Thanh toan phan con lai HD001'
),
(
    'TT003',
    'DP002',
    NULL,
    '2026-08-19 10:20:00',
    900000.00,
    'CASH',
    'COMPLETED',
    'Tien coc booking DP002'
),
(
    'TT004',
    'DP002',
    'HD002',
    '2026-08-23 11:20:00',
    3520000.00,
    'E_WALLET',
    'COMPLETED',
    'Thanh toan phan con lai HD002'
);


-- ============================================================
-- COMMIT
-- ============================================================

COMMIT;
