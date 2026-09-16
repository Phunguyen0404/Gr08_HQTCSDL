-- ============================================================
-- HOTEL MANAGEMENT SYSTEM
-- TRIGGERS
-- DBMS: MySQL 9.3.0
-- ============================================================

USE hotel_management;


-- ============================================================
-- 1. trg_TAI_KHOAN_ValidateInsert
-- Muc dich: Kiem tra rang buoc nghiep vu khi them tai khoan moi:
--   - TenDangNhap khong duoc rong, tu 8 den 30 ky tu
--   - TenDangNhap chi duoc chua chu cai va chu so
--   - TenDangNhap phai co it nhat mot chu cai
--   - MatKhauHash khong duoc de trong
-- ============================================================

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
-- 2. TRG_DAT_PHONG_TRUOC_HUY
-- Muc dich: Chan huy don dat phong khi don da CHECKED_IN hoac COMPLETED.
-- Ap dung khi ung dung chay: UPDATE DAT_PHONG SET TrangThai='CANCELLED' ...
-- ============================================================

DROP TRIGGER IF EXISTS TRG_DAT_PHONG_TRUOC_HUY;

DELIMITER $$

CREATE TRIGGER TRG_DAT_PHONG_TRUOC_HUY
BEFORE UPDATE ON DAT_PHONG
FOR EACH ROW
BEGIN
    IF NEW.TrangThai = 'CANCELLED' AND OLD.TrangThai <> NEW.TrangThai THEN
        IF OLD.TrangThai IN ('CHECKED_IN', 'COMPLETED') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'LOI: Khong the huy don da nhan phong hoac da hoan tat';
        END IF;
    END IF;
END$$

DELIMITER ;


-- ============================================================
-- 3. TRG_DAT_PHONG_SAU_HUY
-- Muc dich: Khi don dat phong chuyen sang CANCELLED, neu co ban ghi
--           LUU_TRU dang IN_HOUSE gan voi don nay thi huy luon (dong bo).
-- ============================================================

DROP TRIGGER IF EXISTS TRG_DAT_PHONG_SAU_HUY;

DELIMITER $$

CREATE TRIGGER TRG_DAT_PHONG_SAU_HUY
AFTER UPDATE ON DAT_PHONG
FOR EACH ROW
BEGIN
    IF NEW.TrangThai = 'CANCELLED' AND OLD.TrangThai <> NEW.TrangThai THEN
        UPDATE LUU_TRU
           SET TrangThai = 'CANCELLED'
         WHERE MaDatPhong = NEW.MaDatPhong
           AND TrangThai = 'IN_HOUSE';
    END IF;
END$$

DELIMITER ;