-- ==============================================================================
-- HOTEL MANAGEMENT SYSTEM
-- TRANSACTIONS - CONCURRENCY CONTROL SOLUTIONS (BẢN HOÀN CHỈNH KHẮC PHỤC)
-- DBMS: MySQL (InnoDB)
-- ==============================================================================

USE hotel_management;

-- ==============================================================================
-- 1. GIẢI QUYẾT LOST UPDATE: KHÓA BI QUAN (PESSIMISTIC LOCKING VỚI FOR UPDATE)
-- Cơ chế: Sử dụng SELECT ... FOR UPDATE khóa các dòng có nguy cơ chồng lấn thời
-- gian. Giao dịch đến sau phải chờ hoặc phát hiện xung đột và ROLLBACK an toàn.
-- ==============================================================================

-- Session 1: Đặt phòng qua Stored Procedure (bên trong có START TRANSACTION và FOR UPDATE)
CALL SP_TAO_DAT_PHONG(
    'KH001', NULL,
    '2026-12-10 14:00:00', '2026-12-12 12:00:00',
    2, 500000, 'Khach A dat phong',
    '[{"MaPhong": "P101", "DonGia": 600000}]',
    @dp1, @bk1, @kq1
);
SELECT @dp1 AS MaDatPhong_S1, @bk1 AS BookingCode_S1, @kq1 AS KetQua_S1;

-- Session 2: Đặt cùng phòng P101 trong cùng thời gian (bị chặn và rollback an toàn)
CALL SP_TAO_DAT_PHONG(
    'KH002', NULL,
    '2026-12-10 14:00:00', '2026-12-12 12:00:00',
    2, 500000, 'Khach B dat trung phong',
    '[{"MaPhong": "P101", "DonGia": 600000}]',
    @dp2, @bk2, @kq2
);
SELECT @dp2 AS MaDatPhong_S2, @kq2 AS KetQua_S2;


-- ==============================================================================
-- 1B. MÔ PHỎNG KHÓA CHỜ (LOCK WAIT VỚI SLEEP)
-- Cơ chế: Session 1 giữ khóa độc quyền trong thời gian xử lý, Session 2 phải
-- chờ khóa được giải phóng trước khi tiếp tục.
-- ==============================================================================

-- Session 1: Khóa dòng và giữ khóa trong 8 giây
-- START TRANSACTION;
-- SELECT dp.MaDatPhong, dp.TrangThai 
--   FROM CHI_TIET_DAT_PHONG ctp 
--   JOIN DAT_PHONG dp ON dp.MaDatPhong = ctp.MaDatPhong 
--  WHERE ctp.MaPhong = 'P101' 
--    FOR UPDATE;
-- SELECT SLEEP(8) AS DangXuLyGiaoTac;
-- COMMIT;

-- Session 2: Yêu cầu khóa dòng P101 (chờ Session 1 nhả khóa sau 8 giây)
-- START TRANSACTION;
-- SELECT dp.MaDatPhong, dp.TrangThai 
--   FROM CHI_TIET_DAT_PHONG ctp 
--   JOIN DAT_PHONG dp ON dp.MaDatPhong = ctp.MaDatPhong 
--  WHERE ctp.MaPhong = 'P101' 
--    FOR UPDATE;
-- COMMIT;


-- ==============================================================================
-- 2. GIẢI QUYẾT DIRTY READ: MỨC CÔ LẬP REPEATABLE READ (HOẶC READ COMMITTED)
-- Cơ chế: Không cho phép đọc dữ liệu chưa được COMMIT bởi giao dịch khác.
-- ==============================================================================

SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Session 1: Cập nhật dữ liệu nhưng chưa COMMIT
START TRANSACTION;
UPDATE PHONG SET MoTa = 'DANG_THU_NGHIEM_CHUA_COMMIT' WHERE MaPhong = 'P101';

-- Session 2: Đọc dữ liệu (chỉ đọc giá trị đã commit trước đó, bỏ qua dữ liệu chưa commit)
START TRANSACTION;
SELECT MaPhong, MoTa FROM PHONG WHERE MaPhong = 'P101';

-- Session 1: Hủy bỏ giao dịch
ROLLBACK;

-- Session 2: Hoàn tất
COMMIT;


-- ==============================================================================
-- 3. GIẢI QUYẾT NON-REPEATABLE READ: CƠ CHẾ MVCC (MULTI-VERSION CONCURRENCY CONTROL)
-- Cơ chế: Trong mức cô lập REPEATABLE READ, InnoDB tạo bản chụp (Snapshot) dữ
-- liệu tại thời điểm bắt đầu giao dịch, đảm bảo các lần đọc sau luôn trả về kết quả nhất quán.
-- ==============================================================================

SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Session 1: Đọc trạng thái phòng P201 lần 1
START TRANSACTION;
SELECT MaPhong, TrangThai FROM PHONG WHERE MaPhong = 'P201';

-- Session 2: Cập nhật trạng thái và COMMIT
START TRANSACTION;
UPDATE PHONG SET TrangThai = 'OCCUPIED' WHERE MaPhong = 'P201';
COMMIT;

-- Session 1: Đọc lại phòng P201 lần 2 (giá trị vẫn giữ nguyên từ Snapshot)
SELECT MaPhong, TrangThai FROM PHONG WHERE MaPhong = 'P201';
COMMIT;

-- Khôi phục trạng thái
UPDATE PHONG SET TrangThai = 'AVAILABLE' WHERE MaPhong = 'P201';


-- ==============================================================================
-- 4. GIẢI QUYẾT PHANTOM READ: NEXT-KEY LOCKING (GAP LOCK VỚI FOR UPDATE)
-- Cơ chế: Next-Key Lock khóa cả các bản ghi thỏa mãn điều kiện và các khoảng
-- trống (Gap) xung quanh, ngăn chặn các giao dịch khác INSERT bản ghi mới vào phạm vi.
-- ==============================================================================

-- Session 1: Khóa toàn bộ khoảng phạm vi Tang = 9
START TRANSACTION;
SELECT * FROM PHONG WHERE Tang = 9 FOR UPDATE;

-- Session 2: Chèn phòng mới vào khoảng Tang = 9 (bị chặn lại do Gap Lock)
START TRANSACTION;
-- INSERT INTO PHONG (MaPhong, MaLoaiPhong, SoPhong, Tang, TrangThai, MoTa)
-- VALUES ('P999', 'LP001', '999', 9, 'AVAILABLE', 'Phong tang 9');

-- Session 1: Hoàn tất giao dịch
COMMIT;


-- ==============================================================================
-- 5. GIẢI QUYẾT DEADLOCK: QUY TẮC SẮP XẾP THỨ TỰ TÀI NGUYÊN (RESOURCE ORDERING)
-- Cơ chế: Mọi giao dịch truy cập nhiều tài nguyên phải tuân thủ cùng một thứ tự
-- khóa tăng dần (ORDER BY MaPhong ASC). Điều này triệt tiêu hoàn toàn chu trình
-- chờ chéo (Wait-for Graph).
-- ==============================================================================

-- Session 1: Cần khóa P101 và P201 -> Khóa theo thứ tự tăng dần (P101 trước)
START TRANSACTION;
SELECT * FROM PHONG WHERE MaPhong = 'P101' FOR UPDATE;

-- Session 2: Cần khóa P201 và P101 -> Tuân thủ quy tắc khóa P101 trước
START TRANSACTION;
SELECT * FROM PHONG WHERE MaPhong = 'P101' FOR UPDATE;

-- Session 1: Khóa tiếp P201 và COMMIT
SELECT * FROM PHONG WHERE MaPhong = 'P201' FOR UPDATE;
COMMIT;

-- Session 2: Nhận được khóa P101 tuần tự, tiếp tục khóa P201 và COMMIT (không bị Deadlock)
SELECT * FROM PHONG WHERE MaPhong = 'P201' FOR UPDATE;
COMMIT;
