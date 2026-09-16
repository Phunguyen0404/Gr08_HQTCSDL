-- ============================================================
-- HOTEL MANAGEMENT SYSTEM
-- KỊCH BẢN KIỂM THỬ GIAO TÁC & TRANH CHẤP ĐỒNG THỜI (TRANSACTIONS)
-- Môn học: Hệ Quản Trị Cơ Sở Dữ Liệu
-- DBMS: MySQL 9.3.0 (Engine: InnoDB)
-- ============================================================
-- Hướng dẫn thực nghiệm:
-- Mở 2 cửa sổ Terminal / MySQL Workbench / DBeaver độc lập:
--   - Cửa sổ 1: Đóng vai trò là SESSION 1 (Khách hàng A hoặc Lễ tân A)
--   - Cửa sổ 2: Đóng vai trò là SESSION 2 (Khách hàng B hoặc Lễ tân B)
-- Chạy từng câu lệnh theo thứ tự mốc thời gian T1, T2, T3... để quan sát lỗi
-- và cơ chế giải quyết tranh chấp của Hệ quản trị CSDL.
-- ============================================================

USE hotel_management;

-- ============================================================
-- KỊCH BẢN 1: TRANH CHẤP ĐẶT TRÙNG PHÒNG (LOST UPDATE / OVERBOOKING)
-- ============================================================
-- Vấn đề nghiệp vụ:
-- Khách A (Session 1) và Khách B (Session 2) cùng tìm thấy phòng P101 trống
-- trong khoảng thời gian từ 2026-11-20 đến 2026-11-22.
-- Cả 2 cùng quyết định bấm Đặt phòng gần như cùng một thời điểm.
--
-- ------------------------------------------------------------
-- PHẦN 1A: KHI HỆ THỐNG KHÔNG DÙNG TRANSACTION / KHÓA (GÂY LỖI)
-- ------------------------------------------------------------
-- [T1 - Session 1]: Kiểm tra thấy phòng P101 đang trống trong khoảng thời gian này
SELECT COUNT(*) AS SoLuongTrung 
  FROM DAT_PHONG dp
  JOIN CHI_TIET_DAT_PHONG ctp ON dp.MaDatPhong = ctp.MaDatPhong
 WHERE ctp.MaPhong = 'P101'
   AND dp.TrangThai NOT IN ('CANCELLED', 'NO_SHOW')
   AND dp.NgayNhanDuKien < '2026-11-22 12:00:00'
   AND dp.NgayTraDuKien  > '2026-11-20 14:00:00';
-- Kết quả trả về: 0 (Phòng trống, đủ điều kiện đặt)

-- [T2 - Session 2]: Cùng lúc đó, Session 2 cũng kiểm tra phòng P101
SELECT COUNT(*) AS SoLuongTrung 
  FROM DAT_PHONG dp
  JOIN CHI_TIET_DAT_PHONG ctp ON dp.MaDatPhong = ctp.MaDatPhong
 WHERE ctp.MaPhong = 'P101'
   AND dp.TrangThai NOT IN ('CANCELLED', 'NO_SHOW')
   AND dp.NgayNhanDuKien < '2026-11-22 12:00:00'
   AND dp.NgayTraDuKien  > '2026-11-20 14:00:00';
-- Kết quả cũng trả về: 0 (Cả 2 cùng thấy phòng trống)

-- [T3 - Session 1]: Đặt phòng thành công
INSERT INTO DAT_PHONG (MaDatPhong, MaBookingCode, MaKH, NgayDat, NgayNhanDuKien, NgayTraDuKien, SoNguoiDuKien, TrangThai)
VALUES ('DP_ERR1', 'BK_ERR001', 'KH001', NOW(), '2026-11-20 14:00:00', '2026-11-22 12:00:00', 2, 'PENDING');
INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, DonGiaDat) VALUES ('DP_ERR1', 'P101', 900000);

-- [T4 - Session 2]: Chậm hơn 1 giây, nhưng vì T2 đã kiểm tra thấy 0 nên vẫn chèn dữ liệu!
INSERT INTO DAT_PHONG (MaDatPhong, MaBookingCode, MaKH, NgayDat, NgayNhanDuKien, NgayTraDuKien, SoNguoiDuKien, TrangThai)
VALUES ('DP_ERR2', 'BK_ERR002', 'KH002', NOW(), '2026-11-20 14:00:00', '2026-11-22 12:00:00', 2, 'PENDING');
INSERT INTO CHI_TIET_DAT_PHONG (MaDatPhong, MaPhong, DonGiaDat) VALUES ('DP_ERR2', 'P101', 900000);

-- => HẬU QUẢ: CẢ 2 ĐƠN 'DP_ERR1' VÀ 'DP_ERR2' CÙNG ĐẶT THÀNH CÔNG PHÒNG P101 TRONG CÙNG KHOẢNG THỜI GIAN!
-- ĐÂY CHÍNH LÀ LỖI OVERBOOKING / PHANTOM READ KINH ĐIỂN!

-- Dọn dẹp dữ liệu lỗi thử nghiệm:
DELETE FROM CHI_TIET_DAT_PHONG WHERE MaDatPhong IN ('DP_ERR1', 'DP_ERR2');
DELETE FROM DAT_PHONG WHERE MaDatPhong IN ('DP_ERR1', 'DP_ERR2');


-- ------------------------------------------------------------
-- PHẦN 1B: GIẢI QUYẾT BẰNG TRANSACTION & PESSIMISTIC LOCK (SP_TAO_DAT_PHONG)
-- ------------------------------------------------------------
-- Cơ chế khắc phục:
-- Sử dụng START TRANSACTION kết hợp SELECT ... FOR UPDATE OF dp, ctp.
-- Khi Session 1 bắt đầu đọc và khóa dữ liệu, Session 2 nếu cố gắng đọc để
-- kiểm tra sẽ phải CHỜ (WAIT LOCK) hoặc khi đọc xong thì Session 1 đã commit,
-- từ đó phát hiện xung đột và ROLLBACK.

-- [T1 - Session 1]: Gọi SP_TAO_DAT_PHONG để đặt phòng P101 (2026-11-20 -> 2026-11-22)
CALL SP_TAO_DAT_PHONG(
    'KH001', NULL,
    '2026-11-20 14:00:00', '2026-11-22 12:00:00',
    2, 500000, 'Test Dat phong Session 1',
    '[{"MaPhong": "P101", "DonGia": 900000}]',
    @dp1, @bk1, @kq1
);
SELECT @dp1 AS MaDatPhong_Session1, @bk1 AS BookingCode, @kq1 AS KetQua;
-- Kết quả Session 1: OK, MaDatPhong = 'DPxxx'

-- [T2 - Session 2]: Đồng thời cũng gửi yêu cầu đặt phòng P101 cùng thời gian
CALL SP_TAO_DAT_PHONG(
    'KH002', NULL,
    '2026-11-20 14:00:00', '2026-11-22 12:00:00',
    2, 500000, 'Test Dat phong Session 2',
    '[{"MaPhong": "P101", "DonGia": 900000}]',
    @dp2, @bk2, @kq2
);
SELECT @dp2 AS MaDatPhong_Session2, @kq2 AS KetQua;
-- => KẾT QUẢ SESSION 2: 
-- KetQua = 'LOI: Mot hoac nhieu phong da duoc dat trong khoang thoi gian nay'
-- Transaction của Session 2 tự động ROLLBACK, không có đơn rác nào được tạo!
-- BẢO VỆ TOÀN VẸN DỮ LIỆU THÀNH CÔNG 100%!



-- ============================================================
-- KỊCH BẢN 2: TÍNH NGUYÊN TỬ (ATOMICITY) VÀ TỰ ĐỘNG ROLLBACK KHI GẶP NGOẠI LỆ
-- ============================================================
-- Vấn đề nghiệp vụ:
-- Trong quá trình Nhận phòng (Check-in), hệ thống cần thực hiện đồng thời:
--   1. Tạo bản ghi LUU_TRU
--   2. Gán khách vào KHACH_LUU_TRU
--   3. Phân phòng PHAN_PHONG
--   4. Cập nhật PHONG sang OCCUPIED
--   5. Cập nhật DAT_PHONG sang CHECKED_IN
-- Nếu bước 3 hoặc 4 thất bại (do sự cố mạng, cúp điện, hoặc ràng buộc dữ liệu),
-- toàn bộ các bước trước đó PHẢI ĐƯỢC ROLLBACK để tránh tình trạng "Đơn thì đã nhận
-- nhưng phòng thì chưa giao" hoặc "Lưu trú mồ côi".

-- [Mô phỏng thực nghiệm]:
-- Thử Check-in cho một đơn đặt phòng không tồn tại hoặc đã bị hủy trước đó:
CALL SP_CHECK_IN('DP_KHONG_TON_TAI', NULL, @maLT_demo, @kq_demo);
SELECT @maLT_demo AS MaLuuTru, @kq_demo AS KetQua;
-- => KẾT QUẢ:
-- KetQua = 'LOI: Khong tim thay don dat phong'
-- Toàn bộ transaction bị hủy bỏ lập tức, không có bất kỳ dòng rác nào trong bảng LUU_TRU.

-- Thử Check-in lần 2 cho một đơn đã Check-in trước đó (DP001):
CALL SP_CHECK_IN('DP001', NULL, @maLT_demo2, @kq_demo2);
SELECT @maLT_demo2 AS MaLuuTru, @kq_demo2 AS KetQua;
-- => KẾT QUẢ:
-- KetQua = 'LOI: Don dat phong nay da hoan tat (da check-out)'
-- Khóa bi quan và bộ tiền điều kiện bảo vệ trạng thái phòng an toàn.



-- ============================================================
-- KỊCH BẢN 3: ĐỒNG BỘ TRẠNG THÁI TOÀN HỆ THỐNG TRONG GIAO TÁC CHECK-OUT
-- ============================================================
-- Vấn đề nghiệp vụ:
-- Khi khách trả phòng (Check-out):
--   - CSDL phải đồng thời: Đóng lưu trú, cập nhật giờ trả, tính tiền phòng,
--     sinh hóa đơn, ghi nhận thanh toán và chuyển phòng sang CLEANING.
--   - Nếu việc ghi nhận thanh toán bị lỗi, hóa đơn KHÔNG ĐƯỢC PHÉP tồn tại ở trạng thái lơ lửng.
--
-- Thực nghiệm với SP_CHECK_OUT:
-- Giao tác thực thi trọn vẹn trong khối START TRANSACTION ... COMMIT.
-- Có Handler bắt lỗi:
--   DECLARE EXIT HANDLER FOR SQLEXCEPTION
--   BEGIN
--       GET DIAGNOSTICS CONDITION 1 v_err_no = MYSQL_ERRNO, v_err_msg = MESSAGE_TEXT;
--       ROLLBACK;
--       SET p_KetQua = CONCAT('LOI SQL [', v_err_no, ']: ', v_err_msg);
--   END;
--
-- Đồng thời kích hoạt Trigger tự động:
--   - Trigger TRG_THANH_TOAN_AFTER_INSERT tự động cập nhật HOA_DON sang PAID
--   - Trigger TRG_LUU_TRU_AFTER_UPDATE tự động đổi PHONG sang CLEANING.



-- ============================================================
-- KỊCH BẢN 4: MÔ PHỎNG TRANH CHẤP KHÓA DÒNG (ROW-LEVEL LOCKING DEMO)
-- ============================================================
-- Dùng để trình chiếu trực tiếp trên 2 màn hình Terminal:

-- [BƯỚC 1 - Tại SESSION 1]: Mở transaction và khóa đơn phòng DP001
START TRANSACTION;
SELECT MaDatPhong, TrangThai, TienCocDuKien 
  FROM DAT_PHONG 
 WHERE MaDatPhong = 'DP001' 
   FOR UPDATE;
-- Lúc này Session 1 đang giữ Exclusive Lock (X-Lock) trên dòng DP001.
-- (Chưa gõ COMMIT, giữ nguyên trạng thái).

-- [BƯỚC 2 - Tại SESSION 2]: Cố gắng cập nhật hoặc đọc có khóa dòng DP001
START TRANSACTION;
UPDATE DAT_PHONG 
   SET GhiChu = 'Session 2 co gang sua' 
 WHERE MaDatPhong = 'DP001';
-- => QUAN SÁT HIỆN TƯỢNG TẠI SESSION 2:
-- Con trỏ chuột của Session 2 sẽ DỪNG LẠI và CHỜ (Lock Wait), không thực thi được ngay!
-- Đây là minh chứng rõ ràng nhất cho Giảng viên thấy cơ chế Concurrency Control của InnoDB đang hoạt động!

-- [BƯỚC 3 - Tại SESSION 1]: Kết thúc transaction
COMMIT;

-- => QUAN SÁT NGAY LẬP TỨC TẠI SESSION 2:
-- Ngay sau khi Session 1 COMMIT, Session 2 lập tức được giải phóng khóa và thực thi xong lệnh UPDATE!
-- [Tại Session 2]: Gõ ROLLBACK để hoàn trả dữ liệu ban đầu:
ROLLBACK;



-- ============================================================
-- KỊCH BẢN 5: KIỂM TRA MỨC ĐỘ CÔ LẬP GIAO TÁC (TRANSACTION ISOLATION LEVEL)
-- ============================================================
-- Kiểm tra mức cô lập mặc định của MySQL:
SELECT @@GLOBAL.transaction_isolation, @@SESSION.transaction_isolation;
-- Kết quả: REPEATABLE-READ (Chuẩn mặc định chống Non-repeatable Read)

-- Khi cần mức độ tuần tự hóa cao nhất (chống Phantom Read tuyệt đối):
-- SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
