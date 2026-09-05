-- ============================================================
-- HOTEL MANAGEMENT SYSTEM
-- TRIGGERS
-- DBMS: MySQL 9.3.0
-- ============================================================

USE hotel_management;


-- ============================================================
-- TRG_DAT_PHONG_TRUOC_HUY
-- Muc dich: Chan huy don dat phong khi don da CHECKED_IN hoac COMPLETED.
-- Ap dung khi ung dung chay: UPDATE DAT_PHONG SET TrangThai='CANCELLED' ...
-- ============================================================

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
-- TRG_DAT_PHONG_SAU_HUY
-- Muc dich: Khi don dat phong chuyen sang CANCELLED, neu co ban ghi
--           LUU_TRU dang IN_HOUSE gan voi don nay thi huy luon (dong bo).
-- ============================================================

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