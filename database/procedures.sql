-- ============================================================
-- STORED PROCEDURES & DATABASE LOGIC
-- He quan tri co so du lieu - Hotel Management System
-- DBMS: MySQL 9.3.0
-- ============================================================

USE hotel_management;

-- ============================================================
-- 1. SP_TAO_DAT_PHONG
-- Chuc nang: Tao don dat phong moi voi transaction & row lock,
-- ngan chan tinh trang overbooking (trung phong / trung lich).
-- ============================================================

DROP PROCEDURE IF EXISTS SP_TAO_DAT_PHONG;

DELIMITER $$

CREATE PROCEDURE SP_TAO_DAT_PHONG (
    IN  p_MaKH              VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    IN  p_MaNV_Tao           VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    IN  p_NgayNhanDuKien     DATETIME,
    IN  p_NgayTraDuKien      DATETIME,
    IN  p_SoNguoiDuKien      INT,
    IN  p_TienCocDuKien      DECIMAL(15,2),
    IN  p_GhiChu             VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    IN  p_DanhSachPhong      JSON,
    OUT p_MaDatPhong         VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    OUT p_MaBookingCode      VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    OUT p_KetQua             VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci
)
main_block: BEGIN
    DECLARE v_SoLuongPhong  INT DEFAULT 0;
    DECLARE v_TongSucChua   INT DEFAULT 0;
    DECLARE v_SoLuongTrung  INT DEFAULT 0;
    DECLARE v_MaxSuffix     INT DEFAULT 0;
    DECLARE v_STT           INT DEFAULT 0;
    DECLARE v_err_no        INT;
    DECLARE v_err_msg       VARCHAR(255);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_err_no = MYSQL_ERRNO, v_err_msg = MESSAGE_TEXT;
        ROLLBACK;
        SET p_KetQua = CONCAT('LOI SQL [', IFNULL(v_err_no, 0), ']: ', IFNULL(v_err_msg, 'Da xay ra loi he thong'));
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
             COLUMNS (MaPhong VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$.MaPhong')
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
             COLUMNS (MaPhong VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$.MaPhong')
           ) AS jt
      JOIN CHI_TIET_DAT_PHONG ctp ON ctp.MaPhong = jt.MaPhong
      JOIN DAT_PHONG dp           ON dp.MaDatPhong = ctp.MaDatPhong
     WHERE dp.TrangThai NOT IN ('CANCELLED', 'NO_SHOW')
       AND dp.NgayNhanDuKien < p_NgayTraDuKien
       AND dp.NgayTraDuKien  > p_NgayNhanDuKien
     FOR UPDATE OF dp, ctp;

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
                 MaPhong        VARCHAR(20)    CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$.MaPhong',
                 DonGia         DECIMAL(15,2)  PATH '$.DonGia',
                 GhiChuChiTiet  VARCHAR(255)   CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci PATH '$.GhiChu'
             )
           ) AS jt
      JOIN PHONG p       ON p.MaPhong = jt.MaPhong
      JOIN LOAI_PHONG lp ON lp.MaLoaiPhong = p.MaLoaiPhong;

    COMMIT;
    SET p_KetQua = 'OK';

END main_block $$

DELIMITER ;


-- ============================================================
-- 2. SP_CHECK_IN
-- Chuc nang: Nhan phong cho khach, kiem tra trang thai phong,
-- tao ban ghi LUU_TRU, KHACH_LUU_TRU, PHAN_PHONG va doi trang
-- thai don sang CHECKED_IN, doi phong sang OCCUPIED.
-- ============================================================

DROP PROCEDURE IF EXISTS SP_CHECK_IN;

DELIMITER $$

CREATE PROCEDURE SP_CHECK_IN (
    IN  p_MaDatPhong VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    IN  p_MaNV       VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    OUT p_MaLuuTru   VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    OUT p_KetQua     VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci
)
checkin_block: BEGIN
    DECLARE v_TrangThaiDP        VARCHAR(50);
    DECLARE v_NgayTraDuKien      DATETIME;
    DECLARE v_MaKH               VARCHAR(20);
    DECLARE v_MaBookingCode      VARCHAR(30);
    DECLARE v_PhongKhongKhaDung  INT DEFAULT 0;
    DECLARE v_MaxLT              INT DEFAULT 0;
    DECLARE v_MaxPP              INT DEFAULT 0;
    DECLARE v_err_no             INT;
    DECLARE v_err_msg            VARCHAR(255);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_err_no = MYSQL_ERRNO, v_err_msg = MESSAGE_TEXT;
        ROLLBACK;
        SET p_KetQua = CONCAT('LOI SQL [', IFNULL(v_err_no, 0), ']: ', IFNULL(v_err_msg, 'Loi thuc hien Check-in'));
    END;

    SET p_KetQua = 'OK';

    START TRANSACTION;

    -- 1. Khoa don dat phong de kiem tra tinh toan ven (Pessimistic Lock)
    SELECT TrangThai, NgayTraDuKien, MaKH, MaBookingCode
      INTO v_TrangThaiDP, v_NgayTraDuKien, v_MaKH, v_MaBookingCode
      FROM DAT_PHONG
     WHERE MaDatPhong = p_MaDatPhong
       FOR UPDATE;

    IF v_TrangThaiDP IS NULL THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Khong tim thay don dat phong';
        LEAVE checkin_block;
    END IF;

    IF v_TrangThaiDP = 'CHECKED_IN' THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Don dat phong nay da duoc check-in truoc do';
        LEAVE checkin_block;
    END IF;

    IF v_TrangThaiDP = 'COMPLETED' THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Don dat phong nay da hoan tat (da check-out)';
        LEAVE checkin_block;
    END IF;

    IF v_TrangThaiDP = 'CANCELLED' THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Don dat phong nay da bi huy, khong the check-in';
        LEAVE checkin_block;
    END IF;

    -- 2. Kiem tra xem co phong nao dang bi OCCUPIED hoac MAINTENANCE khong
    SELECT COUNT(*)
      INTO v_PhongKhongKhaDung
      FROM CHI_TIET_DAT_PHONG ctp
      JOIN PHONG p ON p.MaPhong = ctp.MaPhong
     WHERE ctp.MaDatPhong = p_MaDatPhong
       AND p.TrangThai IN ('OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE');

    IF v_PhongKhongKhaDung > 0 THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Co phong dang co khach o (OCCUPIED) hoac dang bao tri, khong the nhan phong';
        LEAVE checkin_block;
    END IF;

    -- 3. Sinh ma Luu Tru moi (LTxxx)
    SELECT IFNULL(MAX(CAST(SUBSTRING(MaLuuTru, 3) AS UNSIGNED)), 0) + 1
      INTO v_MaxLT
      FROM LUU_TRU;
    SET p_MaLuuTru = CONCAT('LT', LPAD(v_MaxLT, 3, '0'));

    -- 4. Tao ban ghi Luu Tru (IN_HOUSE)
    INSERT INTO LUU_TRU (
        MaLuuTru, MaDatPhong, CheckInAt, CheckOutDuKien, TrangThai, GhiChuLuuTru
    ) VALUES (
        p_MaLuuTru, p_MaDatPhong, NOW(), v_NgayTraDuKien, 'IN_HOUSE',
        CONCAT('Nhan phong theo don ', IFNULL(v_MaBookingCode, p_MaDatPhong))
    );

    -- 5. Gan khach dai dien vao KHACH_LUU_TRU
    INSERT INTO KHACH_LUU_TRU (MaLuuTru, MaKH, VaiTro)
    VALUES (p_MaLuuTru, v_MaKH, 'BOOKER')
    ON DUPLICATE KEY UPDATE VaiTro = VALUES(VaiTro);

    -- 6. Phan phong vao PHAN_PHONG
    SELECT IFNULL(MAX(CAST(SUBSTRING(MaPhanPhong, 3) AS UNSIGNED)), 0)
      INTO v_MaxPP
      FROM PHAN_PHONG;

    INSERT INTO PHAN_PHONG (MaPhanPhong, MaLuuTru, MaPhong, ThoiGianBatDau, GhiChu)
    SELECT
        CONCAT('PP', LPAD(v_MaxPP + ROW_NUMBER() OVER (ORDER BY ctp.MaPhong), 3, '0')),
        p_MaLuuTru,
        ctp.MaPhong,
        NOW(),
        'Phan phong luc check-in'
      FROM CHI_TIET_DAT_PHONG ctp
     WHERE ctp.MaDatPhong = p_MaDatPhong;

    -- 7. Cap nhat trang thai Phong sang OCCUPIED
    UPDATE PHONG
       SET TrangThai = 'OCCUPIED'
     WHERE MaPhong IN (SELECT MaPhong FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong = p_MaDatPhong);

    -- 8. Cap nhat trang thai Don dat phong sang CHECKED_IN
    UPDATE DAT_PHONG
       SET TrangThai = 'CHECKED_IN'
     WHERE MaDatPhong = p_MaDatPhong;

    COMMIT;
    SET p_KetQua = 'OK';

END checkin_block $$

DELIMITER ;


-- ============================================================
-- 3. SP_CHECK_OUT
-- Chuc nang: Tra phong, tinh toan tien phong dua tren so ngay thuc te,
-- xuat Hoa don (HOA_DON), ghi nhan Thanh toan (THANH_TOAN),
-- chuyen trang thai phong sang CLEANING va don sang COMPLETED.
-- ============================================================

DROP PROCEDURE IF EXISTS SP_CHECK_OUT;

DELIMITER $$

CREATE PROCEDURE SP_CHECK_OUT (
    IN  p_MaDatPhong  VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    IN  p_PhuongThuc  VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    OUT p_MaHoaDon    VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
    OUT p_TongTien    DECIMAL(15,2),
    OUT p_KetQua      VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci
)
checkout_block: BEGIN
    DECLARE v_TrangThaiDP       VARCHAR(50);
    DECLARE v_NgayNhanDuKien     DATETIME;
    DECLARE v_MaBookingCode     VARCHAR(30);
    DECLARE v_MaLuuTru          VARCHAR(20);
    DECLARE v_CheckInAt         DATETIME;
    DECLARE v_SoNgay            INT DEFAULT 1;
    DECLARE v_TongTienPhong     DECIMAL(15,2) DEFAULT 0;
    DECLARE v_Thue              DECIMAL(15,2) DEFAULT 0;
    DECLARE v_TongTien          DECIMAL(15,2) DEFAULT 0;
    DECLARE v_MaxHD             INT DEFAULT 0;
    DECLARE v_MaxTT             INT DEFAULT 0;
    DECLARE v_MaThanhToan       VARCHAR(20);
    DECLARE v_err_no            INT;
    DECLARE v_err_msg           VARCHAR(255);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_err_no = MYSQL_ERRNO, v_err_msg = MESSAGE_TEXT;
        ROLLBACK;
        SET p_KetQua = CONCAT('LOI SQL [', IFNULL(v_err_no, 0), ']: ', IFNULL(v_err_msg, 'Loi thuc hien Check-out'));
    END;

    SET p_KetQua = 'OK';
    SET p_TongTien = 0;

    START TRANSACTION;

    -- 1. Khoa don dat phong de kiem tra (Row Lock)
    SELECT TrangThai, NgayNhanDuKien, MaBookingCode
      INTO v_TrangThaiDP, v_NgayNhanDuKien, v_MaBookingCode
      FROM DAT_PHONG
     WHERE MaDatPhong = p_MaDatPhong
       FOR UPDATE;

    IF v_TrangThaiDP IS NULL THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Khong tim thay don dat phong';
        LEAVE checkout_block;
    END IF;

    IF v_TrangThaiDP = 'COMPLETED' THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Don dat phong nay da duoc tra phong va hoan tat truoc do';
        LEAVE checkout_block;
    END IF;

    IF v_TrangThaiDP <> 'CHECKED_IN' THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Don dat phong chua duoc check-in (nhan phong)';
        LEAVE checkout_block;
    END IF;

    -- 2. Tim ban ghi Luu Tru dang o (IN_HOUSE)
    SELECT MaLuuTru, CheckInAt
      INTO v_MaLuuTru, v_CheckInAt
      FROM LUU_TRU
     WHERE MaDatPhong = p_MaDatPhong
       AND TrangThai = 'IN_HOUSE'
     ORDER BY CheckInAt DESC
     LIMIT 1
       FOR UPDATE;

    IF v_MaLuuTru IS NULL THEN
        ROLLBACK;
        SET p_KetQua = 'LOI: Khong tim thay thong tin luu tru IN_HOUSE hop le';
        LEAVE checkout_block;
    END IF;

    -- 3. Cap nhat LUU_TRU sang CHECKED_OUT
    UPDATE LUU_TRU
       SET TrangThai = 'CHECKED_OUT',
           CheckOutAt = NOW()
     WHERE MaLuuTru = v_MaLuuTru;

    -- 4. Dong cac phan phong trong PHAN_PHONG (dam bao > ThoiGianBatDau de thoa man CK_PHAN_PHONG_ThoiGian)
    UPDATE PHAN_PHONG
       SET ThoiGianKetThuc = DATE_ADD(GREATEST(NOW(), ThoiGianBatDau), INTERVAL 1 SECOND)
     WHERE MaLuuTru = v_MaLuuTru
       AND ThoiGianKetThuc IS NULL;

    -- 5. Chuyen phong sang trang thai CLEANING (Dang don dep)
    UPDATE PHONG
       SET TrangThai = 'CLEANING'
     WHERE MaPhong IN (SELECT MaPhong FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong = p_MaDatPhong);

    -- 6. Cap nhat DAT_PHONG sang COMPLETED
    UPDATE DAT_PHONG
       SET TrangThai = 'COMPLETED'
     WHERE MaDatPhong = p_MaDatPhong;

    -- 7. Tinh toan tien phong & thue
    SET v_SoNgay = GREATEST(1, CEIL(TIMESTAMPDIFF(SECOND, IFNULL(v_CheckInAt, v_NgayNhanDuKien), NOW()) / 86400));

    SELECT IFNULL(SUM(DonGiaDat * v_SoNgay), 0)
      INTO v_TongTienPhong
      FROM CHI_TIET_DAT_PHONG
     WHERE MaDatPhong = p_MaDatPhong;

    SET v_Thue = ROUND(v_TongTienPhong * 0.1, 2);
    SET v_TongTien = v_TongTienPhong + v_Thue;
    SET p_TongTien = v_TongTien;

    -- 8. Sinh MaHoaDon (HDxxx)
    SELECT IFNULL(MAX(CAST(SUBSTRING(MaHoaDon, 3) AS UNSIGNED)), 0) + 1
      INTO v_MaxHD
      FROM HOA_DON;
    SET p_MaHoaDon = CONCAT('HD', LPAD(v_MaxHD, 3, '0'));

    -- 9. Tao Hoa don
    INSERT INTO HOA_DON (
        MaHoaDon, MaLuuTru, NgayLap,
        TongTienPhong, Thue, GiamGia, TongTien,
        TrangThai, GhiChuHoaDon
    ) VALUES (
        p_MaHoaDon, v_MaLuuTru, NOW(),
        v_TongTienPhong, v_Thue, 0, v_TongTien,
        'DRAFT', CONCAT('Hoa don tra phong cho don ', IFNULL(v_MaBookingCode, p_MaDatPhong))
    );

    -- 10. Ghi nhan Thanh toan (Trigger TRG_THANH_TOAN se tu dong doi HOA_DON sang PAID)
    SELECT IFNULL(MAX(CAST(SUBSTRING(MaThanhToan, 3) AS UNSIGNED)), 0) + 1
      INTO v_MaxTT
      FROM THANH_TOAN;
    SET v_MaThanhToan = CONCAT('TT', LPAD(v_MaxTT, 3, '0'));

    INSERT INTO THANH_TOAN (
        MaThanhToan, MaDatPhong, MaHoaDon,
        NgayThanhToan, PhuongThuc, SoTien,
        TrangThai, GhiChuThanhToan
    ) VALUES (
        v_MaThanhToan, p_MaDatPhong, p_MaHoaDon,
        NOW(), IFNULL(p_PhuongThuc, 'CASH'), v_TongTien,
        'COMPLETED', 'Thanh toan check-out'
    );

    COMMIT;
    SET p_KetQua = 'OK';

END checkout_block $$

DELIMITER ;