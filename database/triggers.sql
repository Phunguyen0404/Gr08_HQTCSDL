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


-- ============================================================
-- 4. TRG_PHAN_PHONG_AFTER_INSERT
-- Muc dich: Khi mot phong duoc phan bo cho khach luu tru (Check-in),
--           tu dong cap nhat trang thai phong do thanh 'OCCUPIED' (Dang thue).
-- ============================================================

DROP TRIGGER IF EXISTS TRG_PHAN_PHONG_AFTER_INSERT;

DELIMITER $$

CREATE TRIGGER TRG_PHAN_PHONG_AFTER_INSERT
AFTER INSERT ON PHAN_PHONG
FOR EACH ROW
BEGIN
    UPDATE PHONG
       SET TrangThai = 'OCCUPIED'
     WHERE MaPhong = NEW.MaPhong;
END$$

DELIMITER ;


-- ============================================================
-- 5. TRG_LUU_TRU_AFTER_UPDATE
-- Muc dich: Dong bo trang thai Phong theo chu ky song cua Luu tru:
--   - Khi CHECKED_OUT: Chuyen tat ca phong thuoc luu tru sang 'CLEANING'.
--   - Khi CANCELLED: Chuyen cac phong dang 'OCCUPIED' ve 'AVAILABLE'.
-- ============================================================

DROP TRIGGER IF EXISTS TRG_LUU_TRU_AFTER_UPDATE;

DELIMITER $$

CREATE TRIGGER TRG_LUU_TRU_AFTER_UPDATE
AFTER UPDATE ON LUU_TRU
FOR EACH ROW
BEGIN
    IF NEW.TrangThai = 'CHECKED_OUT' AND OLD.TrangThai <> 'CHECKED_OUT' THEN
        -- Chuyen phong sang trang thai don dep
        UPDATE PHONG
           SET TrangThai = 'CLEANING'
         WHERE MaPhong IN (
             SELECT DISTINCT MaPhong
               FROM PHAN_PHONG
              WHERE MaLuuTru = NEW.MaLuuTru
         );
    ELSEIF NEW.TrangThai = 'CANCELLED' AND OLD.TrangThai <> 'CANCELLED' THEN
        -- Neu huy luu tru, tra phong ve trang thai trong (AVAILABLE)
        UPDATE PHONG
           SET TrangThai = 'AVAILABLE'
         WHERE MaPhong IN (
             SELECT DISTINCT MaPhong
               FROM PHAN_PHONG
              WHERE MaLuuTru = NEW.MaLuuTru
         ) AND TrangThai = 'OCCUPIED';
    END IF;
END$$

DELIMITER ;


-- ============================================================
-- 6. TRG_THANH_TOAN_AFTER_INSERT
-- Muc dich: Khi co giao dich thanh toan COMPLETED gan voi Hoa Don,
--           kiem tra tong so tien da tra. Neu >= TongTien hoa don thi
--           tu dong cap nhat HOA_DON.TrangThai = 'PAID'.
-- ============================================================

DROP TRIGGER IF EXISTS TRG_THANH_TOAN_AFTER_INSERT;

DELIMITER $$

CREATE TRIGGER TRG_THANH_TOAN_AFTER_INSERT
AFTER INSERT ON THANH_TOAN
FOR EACH ROW
BEGIN
    DECLARE v_TongDaTra   DECIMAL(15,2) DEFAULT 0;
    DECLARE v_TongTienHD  DECIMAL(15,2) DEFAULT 0;

    IF NEW.TrangThai = 'COMPLETED' AND NEW.MaHoaDon IS NOT NULL THEN
        -- Tinh tong cac khoan da thanh toan thanh cong cho hoa don nay
        SELECT IFNULL(SUM(SoTien), 0)
          INTO v_TongDaTra
          FROM THANH_TOAN
         WHERE MaHoaDon = NEW.MaHoaDon
           AND TrangThai = 'COMPLETED';

        -- Lay tong tien phai thanh toan cua hoa don
        SELECT TongTien
          INTO v_TongTienHD
          FROM HOA_DON
         WHERE MaHoaDon = NEW.MaHoaDon;

        -- Neu da tra du hoac du thua tien, danh dau hoa don da thanh toan (PAID)
        IF v_TongDaTra >= v_TongTienHD THEN
            UPDATE HOA_DON
               SET TrangThai = 'PAID'
             WHERE MaHoaDon = NEW.MaHoaDon
               AND TrangThai <> 'PAID';
        END IF;
    END IF;
END$$

DELIMITER ;


-- ============================================================
-- 7. TRG_THANH_TOAN_AFTER_UPDATE
-- Muc dich: Tuong tu khi mot giao dich thanh toan chuyen tu
--           PENDING -> COMPLETED.
-- ============================================================

DROP TRIGGER IF EXISTS TRG_THANH_TOAN_AFTER_UPDATE;

DELIMITER $$

CREATE TRIGGER TRG_THANH_TOAN_AFTER_UPDATE
AFTER UPDATE ON THANH_TOAN
FOR EACH ROW
BEGIN
    DECLARE v_TongDaTra   DECIMAL(15,2) DEFAULT 0;
    DECLARE v_TongTienHD  DECIMAL(15,2) DEFAULT 0;

    IF NEW.TrangThai = 'COMPLETED' AND OLD.TrangThai <> 'COMPLETED' AND NEW.MaHoaDon IS NOT NULL THEN
        SELECT IFNULL(SUM(SoTien), 0)
          INTO v_TongDaTra
          FROM THANH_TOAN
         WHERE MaHoaDon = NEW.MaHoaDon
           AND TrangThai = 'COMPLETED';

        SELECT TongTien
          INTO v_TongTienHD
          FROM HOA_DON
         WHERE MaHoaDon = NEW.MaHoaDon;

        IF v_TongDaTra >= v_TongTienHD THEN
            UPDATE HOA_DON
               SET TrangThai = 'PAID'
             WHERE MaHoaDon = NEW.MaHoaDon
               AND TrangThai <> 'PAID';
        END IF;
    END IF;
END$$

DELIMITER ;