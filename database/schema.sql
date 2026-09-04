-- ============================================================
-- HOTEL MANAGEMENT SYSTEM
-- Database Schema
-- DBMS: MySQL 9.3.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS hotel_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hotel_management;


-- ============================================================
-- 1. TAI_KHOAN
-- ============================================================

CREATE TABLE TAI_KHOAN (
    MaTaiKhoan VARCHAR(20) NOT NULL,
    TenDangNhap VARCHAR(50) NOT NULL,
    MatKhauHash VARCHAR(255) NOT NULL,
    VaiTro ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL,
    TrangThai ENUM('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT PK_TAI_KHOAN
        PRIMARY KEY (MaTaiKhoan),

    CONSTRAINT UQ_TAI_KHOAN_TenDangNhap
        UNIQUE (TenDangNhap)
) ENGINE = InnoDB;
-- Task 3
DROP TRIGGER IF EXISTS trg_TAI_KHOAN_ValidateInsert;
DELIMITER $$
CREATE TRIGGER trg_TAI_KHOAN_ValidateInsert
BEFORE INSERT ON TAI_KHOAN
FOR EACH ROW
BEGIN
    -- 1. Username không được NULL hoặc rỗng
    IF NEW.TenDangNhap IS NULL
       OR TRIM(NEW.TenDangNhap) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TenDangNhap khong duoc de trong';
    END IF;

    -- 2. Username phải có độ dài từ 8 đến 30 ký tự
    IF CHAR_LENGTH(NEW.TenDangNhap) < 8
       OR CHAR_LENGTH(NEW.TenDangNhap) > 30 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TenDangNhap phai co tu 8 den 30 ky tu';
    END IF;

    -- 3. Username chỉ được chứa chữ cái Latin và chữ số
    IF NEW.TenDangNhap NOT REGEXP '^[A-Za-z0-9]+$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TenDangNhap chi duoc chua chu cai va chu so';
    END IF;

    -- 4. Username phải có ít nhất một chữ cái
    IF NEW.TenDangNhap NOT REGEXP '[A-Za-z]' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TenDangNhap phai co it nhat mot chu cai';
    END IF;

    -- 5. Password hash không được NULL hoặc rỗng
    IF NEW.MatKhauHash IS NULL
       OR TRIM(NEW.MatKhauHash) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'MatKhauHash khong duoc de trong';
    END IF;
END$$
DELIMITER ;
-- ============================================================
-- 2. KHACH_HANG
-- ============================================================

CREATE TABLE KHACH_HANG (
    MaKH VARCHAR(20) NOT NULL,
    MaTaiKhoan VARCHAR(20) NULL,
    CCCD VARCHAR(20) NOT NULL,
    HoTen VARCHAR(100) NOT NULL,
    NgaySinh DATE NULL,
    GioiTinh ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    SoDienThoai VARCHAR(20) NOT NULL,
    Email VARCHAR(100) NULL,
    DiaChi VARCHAR(255) NULL,
    QuocTich VARCHAR(50) NULL,
    NgayTao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT PK_KHACH_HANG
        PRIMARY KEY (MaKH),

    CONSTRAINT UQ_KHACH_HANG_MaTaiKhoan
        UNIQUE (MaTaiKhoan),

    CONSTRAINT UQ_KHACH_HANG_CCCD
        UNIQUE (CCCD),

    CONSTRAINT FK_KHACH_HANG_TAI_KHOAN
        FOREIGN KEY (MaTaiKhoan)
        REFERENCES TAI_KHOAN(MaTaiKhoan)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE = InnoDB;


-- ============================================================
-- 3. NHAN_VIEN
-- ============================================================

CREATE TABLE NHAN_VIEN (
    MaNV VARCHAR(20) NOT NULL,
    MaTaiKhoan VARCHAR(20) NOT NULL,
    CCCD VARCHAR(20) NOT NULL,
    HoTen VARCHAR(100) NOT NULL,
    NgaySinh DATE NULL,
    GioiTinh ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    SoDienThoai VARCHAR(20) NOT NULL,
    Email VARCHAR(100) NULL,
    DiaChi VARCHAR(255) NULL,
    ChucVu VARCHAR(100) NOT NULL,
    NgayVaoLam DATE NOT NULL,
    TrangThai ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT PK_NHAN_VIEN
        PRIMARY KEY (MaNV),

    CONSTRAINT UQ_NHAN_VIEN_MaTaiKhoan
        UNIQUE (MaTaiKhoan),

    CONSTRAINT UQ_NHAN_VIEN_CCCD
        UNIQUE (CCCD),

    CONSTRAINT FK_NHAN_VIEN_TAI_KHOAN
        FOREIGN KEY (MaTaiKhoan)
        REFERENCES TAI_KHOAN(MaTaiKhoan)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE = InnoDB;


-- ============================================================
-- 4. LOAI_PHONG
-- ============================================================

CREATE TABLE LOAI_PHONG (
    MaLoaiPhong VARCHAR(20) NOT NULL,
    TenLoaiPhong VARCHAR(100) NOT NULL,
    MoTa VARCHAR(255) NULL,
    SucChua INT NOT NULL,
    GiaCoBan DECIMAL(15,2) NOT NULL,
    TrangThai ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT PK_LOAI_PHONG
        PRIMARY KEY (MaLoaiPhong),

    CONSTRAINT UQ_LOAI_PHONG_TenLoaiPhong
        UNIQUE (TenLoaiPhong),

    CONSTRAINT CK_LOAI_PHONG_SucChua
        CHECK (SucChua > 0),

    CONSTRAINT CK_LOAI_PHONG_GiaCoBan
        CHECK (GiaCoBan >= 0)
) ENGINE = InnoDB;


-- ============================================================
-- 5. PHONG
-- ============================================================

CREATE TABLE PHONG (
    MaPhong VARCHAR(20) NOT NULL,
    MaLoaiPhong VARCHAR(20) NOT NULL,
    SoPhong VARCHAR(20) NOT NULL,
    Tang INT NOT NULL,
    TrangThai ENUM(
        'AVAILABLE',
        'OCCUPIED',
        'CLEANING',
        'MAINTENANCE',
        'OUT_OF_SERVICE'
    ) NOT NULL DEFAULT 'AVAILABLE',
    MoTa VARCHAR(255) NULL,

    CONSTRAINT PK_PHONG
        PRIMARY KEY (MaPhong),

    CONSTRAINT UQ_PHONG_SoPhong
        UNIQUE (SoPhong),

    CONSTRAINT FK_PHONG_LOAI_PHONG
        FOREIGN KEY (MaLoaiPhong)
        REFERENCES LOAI_PHONG(MaLoaiPhong)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE = InnoDB;


-- ============================================================
-- 6. DAT_PHONG
-- ============================================================

CREATE TABLE DAT_PHONG (
    MaDatPhong VARCHAR(20) NOT NULL,
    MaBookingCode VARCHAR(30) NOT NULL,
    MaKH VARCHAR(20) NOT NULL,
    MaNV_Tao VARCHAR(20) NULL,
    NgayDat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    NgayNhanDuKien DATETIME NOT NULL,
    NgayTraDuKien DATETIME NOT NULL,
    SoNguoiDuKien INT NOT NULL,
    TienCocDuKien DECIMAL(15,2) NULL DEFAULT 0,
    TrangThai ENUM(
        'PENDING',
        'CONFIRMED',
        'CANCELLED',
        'NO_SHOW',
        'CHECKED_IN',
        'COMPLETED'
    ) NOT NULL DEFAULT 'PENDING',
    GhiChu VARCHAR(255) NULL,

    CONSTRAINT PK_DAT_PHONG
        PRIMARY KEY (MaDatPhong),

    CONSTRAINT UQ_DAT_PHONG_MaBookingCode
        UNIQUE (MaBookingCode),

    CONSTRAINT FK_DAT_PHONG_KHACH_HANG
        FOREIGN KEY (MaKH)
        REFERENCES KHACH_HANG(MaKH)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT FK_DAT_PHONG_NHAN_VIEN
        FOREIGN KEY (MaNV_Tao)
        REFERENCES NHAN_VIEN(MaNV)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT CK_DAT_PHONG_Ngay
        CHECK (NgayNhanDuKien < NgayTraDuKien),

    CONSTRAINT CK_DAT_PHONG_SoNguoi
        CHECK (SoNguoiDuKien > 0),

    CONSTRAINT CK_DAT_PHONG_TienCoc
        CHECK (TienCocDuKien >= 0)
) ENGINE = InnoDB;


-- ============================================================
-- 7. CHI_TIET_DAT_PHONG
-- ============================================================

CREATE TABLE CHI_TIET_DAT_PHONG (
    MaDatPhong VARCHAR(20) NOT NULL,
    MaPhong VARCHAR(20) NOT NULL,
    DonGiaDat DECIMAL(15,2) NOT NULL,
    GhiChuChiTiet VARCHAR(255) NULL,

    CONSTRAINT PK_CHI_TIET_DAT_PHONG
        PRIMARY KEY (MaDatPhong, MaPhong),

    CONSTRAINT FK_CTDPT_DAT_PHONG
        FOREIGN KEY (MaDatPhong)
        REFERENCES DAT_PHONG(MaDatPhong)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT FK_CTDPT_PHONG
        FOREIGN KEY (MaPhong)
        REFERENCES PHONG(MaPhong)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT CK_CTDPT_DonGiaDat
        CHECK (DonGiaDat >= 0)
) ENGINE = InnoDB;


-- ============================================================
-- 8. LUU_TRU
-- MaDatPhong NULL = Walk-in
-- UNIQUE = một booking tối đa một stay
-- ============================================================

CREATE TABLE LUU_TRU (
    MaLuuTru VARCHAR(20) NOT NULL,
    MaDatPhong VARCHAR(20) NULL,
    CheckInAt DATETIME NOT NULL,
    CheckOutDuKien DATETIME NOT NULL,
    CheckOutAt DATETIME NULL,
    TrangThai ENUM(
        'IN_HOUSE',
        'CHECKED_OUT',
        'CANCELLED'
    ) NOT NULL DEFAULT 'IN_HOUSE',
    GhiChuLuuTru VARCHAR(255) NULL,

    CONSTRAINT PK_LUU_TRU
        PRIMARY KEY (MaLuuTru),

    CONSTRAINT UQ_LUU_TRU_MaDatPhong
        UNIQUE (MaDatPhong),

    CONSTRAINT FK_LUU_TRU_DAT_PHONG
        FOREIGN KEY (MaDatPhong)
        REFERENCES DAT_PHONG(MaDatPhong)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT CK_LUU_TRU_CheckOutDuKien
        CHECK (CheckOutDuKien > CheckInAt),

    CONSTRAINT CK_LUU_TRU_CheckOutAt
        CHECK (
            CheckOutAt IS NULL
            OR CheckOutAt >= CheckInAt
        )
) ENGINE = InnoDB;


-- ============================================================
-- 9. KHACH_LUU_TRU
-- ============================================================

CREATE TABLE KHACH_LUU_TRU (
    MaLuuTru VARCHAR(20) NOT NULL,
    MaKH VARCHAR(20) NOT NULL,
    VaiTro ENUM('BOOKER', 'GUEST') NOT NULL,
    GhiChu VARCHAR(255) NULL,

    CONSTRAINT PK_KHACH_LUU_TRU
        PRIMARY KEY (MaLuuTru, MaKH),

    CONSTRAINT FK_KHACH_LUU_TRU_LUU_TRU
        FOREIGN KEY (MaLuuTru)
        REFERENCES LUU_TRU(MaLuuTru)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT FK_KHACH_LUU_TRU_KHACH_HANG
        FOREIGN KEY (MaKH)
        REFERENCES KHACH_HANG(MaKH)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE = InnoDB;


-- ============================================================
-- 10. PHAN_PHONG
-- ============================================================

CREATE TABLE PHAN_PHONG (
    MaPhanPhong VARCHAR(20) NOT NULL,
    MaLuuTru VARCHAR(20) NOT NULL,
    MaPhong VARCHAR(20) NOT NULL,
    ThoiGianBatDau DATETIME NOT NULL,
    ThoiGianKetThuc DATETIME NULL,
    LyDo VARCHAR(255) NULL,
    GhiChu VARCHAR(255) NULL,

    CONSTRAINT PK_PHAN_PHONG
        PRIMARY KEY (MaPhanPhong),

    CONSTRAINT FK_PHAN_PHONG_LUU_TRU
        FOREIGN KEY (MaLuuTru)
        REFERENCES LUU_TRU(MaLuuTru)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT FK_PHAN_PHONG_PHONG
        FOREIGN KEY (MaPhong)
        REFERENCES PHONG(MaPhong)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT CK_PHAN_PHONG_ThoiGian
        CHECK (
            ThoiGianKetThuc IS NULL
            OR ThoiGianKetThuc > ThoiGianBatDau
        )
) ENGINE = InnoDB;


-- ============================================================
-- 11. HOA_DON
-- ============================================================

CREATE TABLE HOA_DON (
    MaHoaDon VARCHAR(20) NOT NULL,
    MaLuuTru VARCHAR(20) NOT NULL,
    NgayLap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TongTienPhong DECIMAL(15,2) NOT NULL DEFAULT 0,
    Thue DECIMAL(15,2) NOT NULL DEFAULT 0,
    GiamGia DECIMAL(15,2) NOT NULL DEFAULT 0,
    TongTien DECIMAL(15,2) NOT NULL DEFAULT 0,
    TrangThai ENUM(
        'DRAFT',
        'ISSUED',
        'PAID',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',
    GhiChuHoaDon VARCHAR(255) NULL,

    CONSTRAINT PK_HOA_DON
        PRIMARY KEY (MaHoaDon),

    CONSTRAINT UQ_HOA_DON_MaLuuTru
        UNIQUE (MaLuuTru),

    CONSTRAINT FK_HOA_DON_LUU_TRU
        FOREIGN KEY (MaLuuTru)
        REFERENCES LUU_TRU(MaLuuTru)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT CK_HOA_DON_TongTienPhong
        CHECK (TongTienPhong >= 0),

    CONSTRAINT CK_HOA_DON_Thue
        CHECK (Thue >= 0),

    CONSTRAINT CK_HOA_DON_GiamGia
        CHECK (GiamGia >= 0),

    CONSTRAINT CK_HOA_DON_TongTien
        CHECK (TongTien >= 0)
) ENGINE = InnoDB;


-- ============================================================
-- 12. THANH_TOAN
-- ============================================================

CREATE TABLE THANH_TOAN (
    MaThanhToan VARCHAR(20) NOT NULL,
    MaDatPhong VARCHAR(20) NOT NULL,
    MaHoaDon VARCHAR(20) NULL,
    NgayThanhToan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    SoTien DECIMAL(15,2) NOT NULL,
    PhuongThuc ENUM(
        'CASH',
        'CARD',
        'TRANSFER',
        'E_WALLET'
    ) NOT NULL,
    TrangThai ENUM(
        'PENDING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'REFUNDED'
    ) NOT NULL DEFAULT 'COMPLETED',
    GhiChuThanhToan VARCHAR(255) NULL,

    CONSTRAINT PK_THANH_TOAN
        PRIMARY KEY (MaThanhToan),

    CONSTRAINT FK_THANH_TOAN_DAT_PHONG
        FOREIGN KEY (MaDatPhong)
        REFERENCES DAT_PHONG(MaDatPhong)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT FK_THANH_TOAN_HOA_DON
        FOREIGN KEY (MaHoaDon)
        REFERENCES HOA_DON(MaHoaDon)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT CK_THANH_TOAN_SoTien
        CHECK (SoTien > 0)
) ENGINE = InnoDB;


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IDX_PHONG_MaLoaiPhong
    ON PHONG(MaLoaiPhong);

CREATE INDEX IDX_DAT_PHONG_MaKH
    ON DAT_PHONG(MaKH);

CREATE INDEX IDX_DAT_PHONG_MaNV_Tao
    ON DAT_PHONG(MaNV_Tao);

CREATE INDEX IDX_CTDPT_MaPhong
    ON CHI_TIET_DAT_PHONG(MaPhong);

CREATE INDEX IDX_LUU_TRU_TrangThai
    ON LUU_TRU(TrangThai);

CREATE INDEX IDX_KHACH_LUU_TRU_MaKH
    ON KHACH_LUU_TRU(MaKH);

CREATE INDEX IDX_PHAN_PHONG_MaLuuTru
    ON PHAN_PHONG(MaLuuTru);

CREATE INDEX IDX_PHAN_PHONG_MaPhong
    ON PHAN_PHONG(MaPhong);

CREATE INDEX IDX_HOA_DON_TrangThai
    ON HOA_DON(TrangThai);

CREATE INDEX IDX_THANH_TOAN_MaDatPhong
    ON THANH_TOAN(MaDatPhong);

CREATE INDEX IDX_THANH_TOAN_MaHoaDon
    ON THANH_TOAN(MaHoaDon);
