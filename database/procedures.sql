-- ============================================================
-- HOTEL MANAGEMENT SYSTEM
-- STORED PROCEDURES
-- DBMS: MySQL 9.3.0
-- ============================================================

USE hotel_management;


-- ============================================================
-- SP_TAO_DAT_PHONG
-- Muc dich: Tao don dat phong moi (mot hoac nhieu phong),
--           co kiem tra trung lich de tranh race condition.
--
-- Tham so:
--   IN  p_MaKH              VARCHAR(20)   - Khach hang dat phong (FK KHACH_HANG)
--   IN  p_MaNV_Tao          VARCHAR(20)   - NULL neu khach tu dat online
--   IN  p_NgayNhanDuKien    DATETIME      - Ngay gio nhan phong du kien
--   IN  p_NgayTraDuKien     DATETIME      - Ngay gio tra phong du kien
--   IN  p_SoNguoiDuKien     INT           - So khach du kien o
--   IN  p_TienCocDuKien     DECIMAL(15,2) - Tien coc (co the NULL -> mac dinh 0)
--   IN  p_GhiChu            VARCHAR(255)  - Ghi chu don dat phong
--   IN  p_DanhSachPhong     JSON          - Vd: [{"MaPhong":"P201","DonGia":900000,"GhiChu":"..."}]
--   OUT p_MaDatPhong        VARCHAR(20)   - Ma don dat phong vua sinh ra
--   OUT p_MaBookingCode     VARCHAR(30)   - Ma booking code
--   OUT p_KetQua            VARCHAR(255)  - 'OK' hoac thong bao loi cu the
--
-- Cac buoc xu ly chinh:
--   1. Validate ngay nhan < ngay tra
--   2. Kiem tra danh sach phong ton tai + tinh tong suc chua
--   3. START TRANSACTION
--   4. SELECT ... FOR UPDATE de khoa cac don dat phong lien quan,
--      kiem tra trung khoang thoi gian
--   5. Neu trung lich -> ROLLBACK, tra loi
--   6. Sinh MaDatPhong (DPxxx) va MaBookingCode (BK + ngay + STT)
--   7. INSERT INTO DAT_PHONG (TrangThai = 'PENDING')
--   8. INSERT INTO CHI_TIET_DAT_PHONG cho tung phong
--   9. COMMIT
--  10. EXIT HANDLER FOR SQLEXCEPTION tu dong ROLLBACK neu co loi
-- ============================================================

DELIMITER $$

CREATE PROCEDURE SP_TAO_DAT_PHONG (
    IN  p_MaKH              VARCHAR(20),
    IN  p_MaNV_Tao           VARCHAR(20),
    IN  p_NgayNhanDuKien     DATETIME,
    IN  p_NgayTraDuKien      DATETIME,
    IN  p_SoNguoiDuKien      INT,
    IN  p_TienCocDuKien      DECIMAL(15,2),
    IN  p_GhiChu             VARCHAR(255),
    IN  p_DanhSachPhong      JSON,
    OUT p_MaDatPhong         VARCHAR(20),
    OUT p_MaBookingCode      VARCHAR(30),
    OUT p_KetQua             VARCHAR(255)
)
main_block: BEGIN
    DECLARE v_SoLuongPhong  INT DEFAULT 0;
    DECLARE v_TongSucChua   INT DEFAULT 0;
    DECLARE v_SoLuongTrung  INT DEFAULT 0;
    DECLARE v_MaxSuffix     INT DEFAULT 0;
    DECLARE v_STT           INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_KetQua = 'LOI: Da xay ra loi he thong khi xu ly dat phong, giao dich da duoc rollback.';
    END;

    SET p_KetQua = 'OK';

    -- Buoc 1: Kiem tra ngay nhan/tra hop le
    IF p_NgayNhanDuKien >= p_NgayTraDuKien THEN
        SET p_KetQua = 'LOI: Ngay nhan phong phai truoc ngay tra phong';
        LEAVE main_block;
    END IF;

    -- Buoc 2: Kiem tra danh sach phong hop le va tong suc chua
    SELECT COUNT(*), IFNULL(SUM(lp.SucChua), 0)
      INTO v_SoLuongPhong, v_TongSucChua
      FROM JSON_TABLE(
             p_DanhSachPhong, '$[*]'
             COLUMNS (MaPhong VARCHAR(20) PATH '$.MaPhong')
           ) AS jt
      JOIN PHONG p       ON p.MaPhong = jt.MaPhong
      JOIN LOAI_PHONG lp ON lp.MaLoaiPhong = p.MaLoaiPhong;

    IF v_SoLuongPhong = 0 THEN
        SET p_KetQua = 'LOI: Danh sach phong khong hop le hoac khong ton tai';
        LEAVE main_block;
    END IF;

    IF p_SoNguoiDuKien > v_TongSucChua THEN
        SET p_KetQua = 'LOI: So nguoi du kien vuot qua suc chua cua cac phong da chon';
        LEAVE main_block;
    END IF;

    START TRANSACTION;

    -- Buoc 3+4: Khoa va kiem tra trung lich cho cac phong trong danh sach
    SELECT COUNT(*) INTO v_SoLuongTrung
      FROM JSON_TABLE(
             p_DanhSachPhong, '$[*]'
             COLUMNS (MaPhong VARCHAR(20) PATH '$.MaPhong')
           ) AS jt
      JOIN CHI_TIET_DAT_PHONG ctp ON ctp.MaPhong = jt.MaPhong
      JOIN DAT_PHONG dp           ON dp.MaDatPhong = ctp.MaDatPhong
     WHERE dp.TrangThai NOT IN ('CANCELLED', 'NO_SHOW')
       AND dp.NgayNhanDuKien < p_NgayTraDuKien
       AND dp.NgayTraDuKien  > p_NgayNhanDuKien
     FOR UPDATE;

    IF v_SoLuongTrung > 0 THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Mot hoac nhieu phong da duoc dat trong khoang thoi gian nay';
        LEAVE main_block;
    END IF;

    -- Buoc 5: Sinh ma dat phong (DPxxx)
    SELECT IFNULL(MAX(CAST(SUBSTRING(MaDatPhong, 3) AS UNSIGNED)), 0) + 1
      INTO v_MaxSuffix
      FROM DAT_PHONG;
    SET p_MaDatPhong = CONCAT('DP', LPAD(v_MaxSuffix, 3, '0'));

    -- Sinh ma booking code (BK + yyyymmdd + STT trong ngay)
    SELECT IFNULL(MAX(CAST(SUBSTRING(MaBookingCode, 11) AS UNSIGNED)), 0) + 1
      INTO v_STT
      FROM DAT_PHONG
     WHERE MaBookingCode LIKE CONCAT('BK', DATE_FORMAT(NOW(), '%Y%m%d'), '%');
    SET p_MaBookingCode = CONCAT('BK', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(v_STT, 3, '0'));

    -- Buoc 6: Tao don dat phong
    INSERT INTO DAT_PHONG (
        MaDatPhong, MaBookingCode, MaKH, MaNV_Tao,
        NgayDat, NgayNhanDuKien, NgayTraDuKien,
        SoNguoiDuKien, TienCocDuKien, TrangThai, GhiChu
    )
    VALUES (
        p_MaDatPhong, p_MaBookingCode, p_MaKH, p_MaNV_Tao,
        NOW(), p_NgayNhanDuKien, p_NgayTraDuKien,
        p_SoNguoiDuKien, IFNULL(p_TienCocDuKien, 0), 'PENDING', p_GhiChu
    );

    -- Buoc 7: Gan tung phong vao don dat phong
    INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, DonGiaDat, GhiChuChiTiet)
    SELECT
        p_MaDatPhong,
        jt.MaPhong,
        IFNULL(jt.DonGia, lp.GiaCoBan),
        jt.GhiChuChiTiet
      FROM JSON_TABLE(
             p_DanhSachPhong, '$[*]'
             COLUMNS (
                 MaPhong        VARCHAR(20)    PATH '$.MaPhong',
                 DonGia         DECIMAL(15,2)  PATH '$.DonGia',
                 GhiChuChiTiet  VARCHAR(255)   PATH '$.GhiChu'
             )
           ) AS jt
      JOIN PHONG p       ON p.MaPhong = jt.MaPhong
      JOIN LOAI_PHONG lp ON lp.MaLoaiPhong = p.MaLoaiPhong;

    COMMIT;
    SET p_KetQua = 'OK';

END main_block $$

DELIMITER ;


-- ============================================================
-- Vi du goi thu
-- ============================================================
-- CALL SP_TAO_DAT_PHONG(
--     'KH001', NULL,
--     '2026-09-01 14:00:00', '2026-09-03 12:00:00',
--     2, 500000, 'Dat online',
--     '[{"MaPhong":"P201","DonGia":900000,"GhiChu":"Phong Deluxe"}]',
--     @maDatPhong, @maBookingCode, @ketQua
-- );
-- SELECT @maDatPhong, @maBookingCode, @ketQua;