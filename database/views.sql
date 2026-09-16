-- ============================================================
-- HOTEL MANAGEMENT SYSTEM
-- VIEWS (BẢNG ẢO DỮ LIỆU)
-- DBMS: MySQL 9.3.0
-- ============================================================

USE hotel_management;

-- ============================================================
-- 1. V_DANH_SACH_PHONG
-- Muc dich: Ket hop bang PHONG va LOAI_PHONG de tra ve day du
-- thong tin phong, so phong, tang, loai phong, suc chua, gia ca va mo ta.
-- Giup tang toc truy van, khong can viet JOIN lap di lap lai.
-- ============================================================

CREATE OR REPLACE VIEW V_DANH_SACH_PHONG AS
SELECT 
    p.MaPhong,
    p.SoPhong,
    CONCAT('Phòng ', p.SoPhong) AS TenPhong,
    p.Tang,
    p.MaLoaiPhong,
    lp.TenLoaiPhong,
    lp.GiaCoBan,
    lp.SucChua,
    p.MoTa AS MoTaPhong,
    lp.MoTa AS MoTaLoaiPhong,
    p.TrangThai,
    CASE p.TrangThai
        WHEN 'AVAILABLE' THEN 'Trống / Sẵn sàng'
        WHEN 'OCCUPIED' THEN 'Đang có khách'
        WHEN 'CLEANING' THEN 'Đang dọn dẹp'
        WHEN 'MAINTENANCE' THEN 'Đang bảo trì'
        WHEN 'OUT_OF_SERVICE' THEN 'Tạm ngưng phục vụ'
        ELSE p.TrangThai
    END AS TenTrangThaiHienThi
FROM PHONG p
JOIN LOAI_PHONG lp ON p.MaLoaiPhong = lp.MaLoaiPhong;


-- ============================================================
-- 2. V_DANH_SACH_DAT_PHONG
-- Muc dich: Tong hop toan bo thong tin don dat phong gom:
-- thong tin khach hang, so dem luu tru, danh sach cac phong dat (GROUP_CONCAT),
-- so luong phong va tong tien phong moi dem.
-- ============================================================

CREATE OR REPLACE VIEW V_DANH_SACH_DAT_PHONG AS
SELECT 
    dp.MaDatPhong,
    dp.MaBookingCode,
    dp.MaKH,
    kh.HoTen AS TenKhachHang,
    kh.SoDienThoai,
    kh.Email,
    dp.NgayDat,
    dp.NgayNhanDuKien,
    dp.NgayTraDuKien,
    GREATEST(1, DATEDIFF(dp.NgayTraDuKien, dp.NgayNhanDuKien)) AS SoDemDuKien,
    dp.SoNguoiDuKien,
    dp.TienCocDuKien,
    dp.TrangThai,
    CASE dp.TrangThai
        WHEN 'PENDING' THEN 'Chờ nhận phòng'
        WHEN 'CONFIRMED' THEN 'Đã xác nhận'
        WHEN 'CHECKED_IN' THEN 'Đang lưu trú'
        WHEN 'COMPLETED' THEN 'Đã hoàn tất'
        WHEN 'CANCELLED' THEN 'Đã hủy'
        WHEN 'NO_SHOW' THEN 'Khách không đến'
        ELSE dp.TrangThai
    END AS TenTrangThaiHienThi,
    GROUP_CONCAT(ctp.MaPhong ORDER BY ctp.MaPhong SEPARATOR ', ') AS DanhSachMaPhong,
    COUNT(ctp.MaPhong) AS SoLuongPhong,
    IFNULL(SUM(ctp.DonGiaDat), 0) AS TongTienPhongMoiDem
FROM DAT_PHONG dp
JOIN KHACH_HANG kh ON dp.MaKH = kh.MaKH
LEFT JOIN CHI_TIET_DAT_PHONG ctp ON dp.MaDatPhong = ctp.MaDatPhong
GROUP BY 
    dp.MaDatPhong, dp.MaBookingCode, dp.MaKH, 
    kh.HoTen, kh.SoDienThoai, kh.Email, 
    dp.NgayDat, dp.NgayNhanDuKien, dp.NgayTraDuKien, 
    dp.SoNguoiDuKien, dp.TienCocDuKien, dp.TrangThai;


-- ============================================================
-- 3. V_CHI_TIET_HOA_DON
-- Muc dich: Ket hop Hoa don voi Luu tru, Don dat phong, Khach hang
-- va tong hop so tien da thuc tra tu bang THANH_TOAN.
-- Tu dong tinh toan so tien con thieu (ConThieu).
-- ============================================================

CREATE OR REPLACE VIEW V_CHI_TIET_HOA_DON AS
SELECT 
    hd.MaHoaDon,
    hd.MaLuuTru,
    dp.MaDatPhong,
    dp.MaBookingCode,
    kh.MaKH,
    kh.HoTen AS TenKhachHang,
    kh.SoDienThoai,
    hd.NgayLap,
    lt.CheckInAt,
    lt.CheckOutAt,
    hd.TongTienPhong,
    hd.Thue,
    hd.GiamGia,
    hd.TongTien,
    IFNULL(SUM(CASE WHEN tt.TrangThai = 'COMPLETED' THEN tt.SoTien ELSE 0 END), 0) AS DaThanhToan,
    GREATEST(0, hd.TongTien - IFNULL(SUM(CASE WHEN tt.TrangThai = 'COMPLETED' THEN tt.SoTien ELSE 0 END), 0)) AS ConThieu,
    hd.TrangThai AS TrangThaiHoaDon,
    CASE hd.TrangThai
        WHEN 'DRAFT' THEN 'Bản nháp'
        WHEN 'ISSUED' THEN 'Chờ thanh toán'
        WHEN 'PAID' THEN 'Đã thanh toán đủ'
        WHEN 'CANCELLED' THEN 'Đã hủy'
        ELSE hd.TrangThai
    END AS TenTrangThaiHienThi
FROM HOA_DON hd
JOIN LUU_TRU lt ON hd.MaLuuTru = lt.MaLuuTru
JOIN DAT_PHONG dp ON lt.MaDatPhong = dp.MaDatPhong
JOIN KHACH_HANG kh ON dp.MaKH = kh.MaKH
LEFT JOIN THANH_TOAN tt ON (tt.MaHoaDon = hd.MaHoaDon OR (tt.MaHoaDon IS NULL AND tt.MaDatPhong = dp.MaDatPhong))
GROUP BY 
    hd.MaHoaDon, hd.MaLuuTru, dp.MaDatPhong, dp.MaBookingCode,
    kh.MaKH, kh.HoTen, kh.SoDienThoai, hd.NgayLap,
    lt.CheckInAt, lt.CheckOutAt, hd.TongTienPhong, hd.Thue,
    hd.GiamGia, hd.TongTien, hd.TrangThai;


-- ============================================================
-- 4. V_BAO_CAO_DOANH_THU_THANG
-- Muc dich: Thong ke doanh thu thuc thu theo thang/nam,
-- phan loai chi tiet theo tung phuong thuc thanh toan (Tien mat, The, CK, Vi).
-- Phuc vu Dashboard va Bao cao tai chinh cho quan ly.
-- ============================================================

CREATE OR REPLACE VIEW V_BAO_CAO_DOANH_THU_THANG AS
SELECT 
    DATE_FORMAT(tt.NgayThanhToan, '%Y-%m') AS ThangNam,
    YEAR(tt.NgayThanhToan) AS Nam,
    MONTH(tt.NgayThanhToan) AS Thang,
    COUNT(tt.MaThanhToan) AS SoGiaoDich,
    SUM(tt.SoTien) AS TongDoanhThuThucThu,
    SUM(CASE WHEN tt.PhuongThuc = 'CASH' THEN tt.SoTien ELSE 0 END) AS DoanhThuTienMat,
    SUM(CASE WHEN tt.PhuongThuc = 'TRANSFER' THEN tt.SoTien ELSE 0 END) AS DoanhThuChuyenKhoan,
    SUM(CASE WHEN tt.PhuongThuc = 'CARD' THEN tt.SoTien ELSE 0 END) AS DoanhThuThe,
    SUM(CASE WHEN tt.PhuongThuc = 'E_WALLET' THEN tt.SoTien ELSE 0 END) AS DoanhThuViDienTu
FROM THANH_TOAN tt
WHERE tt.TrangThai = 'COMPLETED'
GROUP BY 
    DATE_FORMAT(tt.NgayThanhToan, '%Y-%m'),
    YEAR(tt.NgayThanhToan),
    MONTH(tt.NgayThanhToan)
ORDER BY ThangNam DESC;


-- ============================================================
-- 5. V_KHACH_HANG_AN_TOAN
-- Muc dich: Bao mat thong tin ca nhan (Data Masking).
-- Che giau so CCCD (chi hien thi 4 so cuoi), che mat khau hash,
-- phuc vu cho nhan vien le tan tra cuu ma khong lo thong tin nhay cam.
-- ============================================================

CREATE OR REPLACE VIEW V_KHACH_HANG_AN_TOAN AS
SELECT 
    kh.MaKH,
    kh.HoTen,
    CONCAT(REPEAT('*', GREATEST(0, CHAR_LENGTH(kh.CCCD) - 4)), RIGHT(kh.CCCD, 4)) AS CCCD_BaoMat,
    kh.SoDienThoai,
    kh.Email,
    kh.QuocTich,
    kh.NgayTao,
    tk.TenDangNhap,
    tk.TrangThai AS TrangThaiTaiKhoan
FROM KHACH_HANG kh
LEFT JOIN TAI_KHOAN tk ON kh.MaTaiKhoan = tk.MaTaiKhoan;
