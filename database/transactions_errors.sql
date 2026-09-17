-- ==============================================================================
-- HOTEL MANAGEMENT SYSTEM
-- TRANSACTIONS - CONCURRENCY ANOMALIES DEMO (LỖI TRANH CHẤP ĐỒNG THỜI)
-- DBMS: MySQL (InnoDB)
-- ==============================================================================

USE hotel_management;

-- ==============================================================================
-- 1. LOST UPDATE (MẤT CẬP NHẬT / GHI ĐÈ DỮ LIỆU)
-- Khái niệm: Hai giao dịch cùng đọc một trạng thái ban đầu và cùng cập nhật độc
-- lập, giao dịch sau ghi đè làm mất tác vụ của giao dịch trước mà không hay biết.
-- ==============================================================================

-- Session 1: Kiểm tra phòng P101 trong khoảng thời gian dự kiến
SELECT COUNT(*) AS SoLuongTrung
  FROM DAT_PHONG dp
  JOIN CHI_TIET_DAT_PHONG ctp ON dp.MaDatPhong = ctp.MaDatPhong
 WHERE ctp.MaPhong = 'P101'
   AND dp.TrangThai NOT IN ('CANCELLED', 'NO_SHOW')
   AND dp.NgayNhanDuKien < '2026-12-03 12:00:00'
   AND dp.NgayTraDuKien  > '2026-12-01 14:00:00';

-- Session 2: Cùng thời điểm, đọc kiểm tra phòng P101 (chưa có khóa)
SELECT COUNT(*) AS SoLuongTrung
  FROM DAT_PHONG dp
  JOIN CHI_TIET_DAT_PHONG ctp ON dp.MaDatPhong = ctp.MaDatPhong
 WHERE ctp.MaPhong = 'P101'
   AND dp.TrangThai NOT IN ('CANCELLED', 'NO_SHOW')
   AND dp.NgayNhanDuKien < '2026-12-03 12:00:00'
   AND dp.NgayTraDuKien  > '2026-12-01 14:00:00';

-- Session 1: Tạo đơn đặt phòng
INSERT INTO DAT_PHONG (MaDatPhong, MaBookingCode, MaKH, NgayDat, NgayNhanDuKien, NgayTraDuKien, SoNguoiDuKien, TrangThai)
VALUES ('DP_ERR1', 'BK_ERR001', 'KH001', NOW(), '2026-12-01 14:00:00', '2026-12-03 12:00:00', 2, 'PENDING');
INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, DonGiaDat) VALUES ('DP_ERR1', 'P101', 600000);

-- Session 2: Tạo đơn đặt phòng (ghi đè lịch đặt của Session 1 do đọc dữ liệu cũ)
INSERT INTO DAT_PHONG (MaDatPhong, MaBookingCode, MaKH, NgayDat, NgayNhanDuKien, NgayTraDuKien, SoNguoiDuKien, TrangThai)
VALUES ('DP_ERR2', 'BK_ERR002', 'KH002', NOW(), '2026-12-01 14:00:00', '2026-12-03 12:00:00', 2, 'PENDING');
INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, DonGiaDat) VALUES ('DP_ERR2', 'P101', 600000);

-- Kiểm tra kết quả tranh chấp: 2 đơn đặt cùng 1 phòng trùng thời gian
SELECT dp.MaDatPhong, dp.MaBookingCode, ctp.MaPhong, dp.NgayNhanDuKien, dp.NgayTraDuKien 
  FROM DAT_PHONG dp
  JOIN CHI_TIET_DAT_PHONG ctp ON dp.MaDatPhong = ctp.MaDatPhong
 WHERE dp.MaDatPhong IN ('DP_ERR1', 'DP_ERR2');

-- Dọn dẹp dữ liệu
DELETE FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong IN ('DP_ERR1', 'DP_ERR2');
DELETE FROM DAT_PHONG WHERE MaDatPhong IN ('DP_ERR1', 'DP_ERR2');


-- ==============================================================================
-- 2. DIRTY READ (ĐỌC DỮ LIỆU RÁC / CHƯA COMMIT)
-- Khái niệm: Giao dịch đọc phải dữ liệu đang được sửa đổi bởi một giao dịch khác
-- chưa COMMIT. Khi giao dịch đó ROLLBACK, dữ liệu đã đọc trở nên không hợp lệ.
-- Mức cô lập xảy ra: READ UNCOMMITTED.
-- ==============================================================================

-- Session 2: Hạ mức cô lập xuống READ UNCOMMITTED
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Session 1: Cập nhật dữ liệu nhưng chưa COMMIT
START TRANSACTION;
UPDATE PHONG SET MoTa = 'GIA_DAC_BIET_100K' WHERE MaPhong = 'P101';

-- Session 2: Đọc dữ liệu chưa commit của Session 1
START TRANSACTION;
SELECT MaPhong, MoTa FROM PHONG WHERE MaPhong = 'P101';

-- Session 1: Hủy bỏ giao dịch (dữ liệu phục hồi lại ban đầu)
ROLLBACK;

-- Session 2: Hoàn tất (đã sử dụng giá trị rác bị hủy bỏ)
COMMIT;

-- Khôi phục mức cô lập mặc định
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
UPDATE PHONG SET MoTa = 'Standard Room 101' WHERE MaPhong = 'P101';


-- ==============================================================================
-- 3. NON-REPEATABLE READ (ĐỌC KHÔNG LẶP LẠI)
-- Khái niệm: Trong cùng một giao dịch, cùng một câu truy vấn đọc một dòng dữ
-- liệu ở hai thời điểm khác nhau trả về giá trị khác nhau do giao dịch khác UPDATE.
-- Mức cô lập xảy ra: READ COMMITTED.
-- ==============================================================================

-- Session 1: Thiết lập mức cô lập READ COMMITTED
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Session 1: Đọc trạng thái phòng P201 lần 1
START TRANSACTION;
SELECT MaPhong, TrangThai FROM PHONG WHERE MaPhong = 'P201';

-- Session 2: Cập nhật trạng thái phòng P201 và COMMIT
START TRANSACTION;
UPDATE PHONG SET TrangThai = 'OCCUPIED' WHERE MaPhong = 'P201';
COMMIT;

-- Session 1: Đọc lại phòng P201 lần 2 (kết quả bị biến đổi giữa chừng)
SELECT MaPhong, TrangThai FROM PHONG WHERE MaPhong = 'P201';
COMMIT;

-- Khôi phục trạng thái
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
UPDATE PHONG SET TrangThai = 'AVAILABLE' WHERE MaPhong = 'P201';


-- ==============================================================================
-- 4. PHANTOM READ (ĐỌC BÓNG MA)
-- Khái niệm: Giao dịch thực hiện truy vấn theo một điều kiện phạm vi. Giao dịch
-- khác INSERT dòng mới thỏa mãn điều kiện đó, khiến lần truy vấn sau xuất hiện
-- thêm bản ghi mới trong cùng một giao dịch.
-- ==============================================================================

-- Session 1: Thiết lập mức cô lập READ COMMITTED
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Session 1: Đếm số lượng phòng tầng 9 lần 1
START TRANSACTION;
SELECT COUNT(*) AS SoPhongTang9 FROM PHONG WHERE Tang = 9;

-- Session 2: Chèn phòng mới vào tầng 9 và COMMIT
START TRANSACTION;
INSERT INTO PHONG (MaPhong, MaLoaiPhong, SoPhong, Tang, TrangThai, MoTa)
VALUES ('P999', 'LP001', '999', 9, 'AVAILABLE', 'Phong tang 9');
COMMIT;

-- Session 1: Đếm lại số lượng phòng tầng 9 lần 2 (xuất hiện dòng mới)
SELECT COUNT(*) AS SoPhongTang9 FROM PHONG WHERE Tang = 9;
COMMIT;

-- Dọn dẹp dữ liệu
DELETE FROM PHONG WHERE MaPhong = 'P999';
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;


-- ==============================================================================
-- 5. DEADLOCK (KHÓA CHẾT)
-- Khái niệm: Hai hay nhiều giao dịch tranh chấp chéo tài nguyên, mỗi bên giữ một
-- khóa và chờ bên kia giải phóng khóa. DBMS phát hiện chu trình chờ và buộc
-- phải hủy bỏ (ROLLBACK) một giao dịch làm nạn nhân.
-- ==============================================================================

-- Session 1: Khóa dòng phòng P101
START TRANSACTION;
SELECT * FROM PHONG WHERE MaPhong = 'P101' FOR UPDATE;

-- Session 2: Khóa dòng phòng P201
START TRANSACTION;
SELECT * FROM PHONG WHERE MaPhong = 'P201' FOR UPDATE;

-- Session 1: Yêu cầu khóa tiếp phòng P201 (chờ Session 2)
SELECT * FROM PHONG WHERE MaPhong = 'P201' FOR UPDATE;

-- Session 2: Yêu cầu khóa tiếp phòng P101 (gây vòng lặp chờ chéo -> Deadlock)
SELECT * FROM PHONG WHERE MaPhong = 'P101' FOR UPDATE;

-- Giải phóng 2 session
ROLLBACK;
