const Customer = require('../models/Customer');
const pool = require('../config/db');

function sendError(res, err) {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        data: null,
        message: status === 500 ? 'Lỗi server' : err.message
    });
}

async function listCustomers(req, res) {
    try {
        const [customers] = await pool.query(`
            SELECT
                KH.MaKH,
                KH.CCCD,
                KH.HoTen,
                KH.SoDienThoai,
                KH.Email,
                KH.DiaChi,
                KH.NgaySinh,
                KH.GioiTinh,
                KH.QuocTich,
                KH.NgayTao,
                KH.MaTaiKhoan,
                TK.TenDangNhap,
                TK.VaiTro,
                TK.TrangThai AS trangThaiTaiKhoan
            FROM KHACH_HANG KH
            LEFT JOIN TAI_KHOAN TK ON KH.MaTaiKhoan = TK.MaTaiKhoan
            ORDER BY KH.MaKH ASC
        `);
        res.status(200).json({ success: true, data: customers });
    } catch (err) {
        sendError(res, err);
    }
}

async function searchCustomers(req, res) {
    try {
        const { cccd, phone } = req.query;
        if (!cccd && !phone) {
            const error = new Error('Vui lòng nhập số CCCD hoặc số điện thoại để tìm kiếm');
            error.status = 400;
            throw error;
        }
        const customers = await Customer.search({ cccd, phone });
        res.status(200).json({ success: true, data: customers, message: 'Tìm kiếm khách hàng thành công' });
    } catch (err) {
        sendError(res, err);
    }
}

async function createCustomer(req, res) {
    try {
        const { hoTen, cccd, soDienThoai, email, ngaySinh, gioiTinh, diaChi } = req.body || {};

        if (!hoTen || !cccd || !soDienThoai) {
            const error = new Error('Họ tên, CCCD và số điện thoại là bắt buộc');
            error.status = 400;
            throw error;
        }

        const customer = await Customer.create({ hoTen, cccd, soDienThoai, email, ngaySinh, gioiTinh, diaChi });
        res.status(201).json({ success: true, data: customer, message: 'Đăng ký khách vãng lai thành công' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            err.status = 409;
            err.message = 'Số CCCD này đã tồn tại trong hệ thống. Hãy tìm kiếm khách hàng thay vì đăng ký mới.';
        }
        sendError(res, err);
    }
}

async function getMyProfile(req, res) {
    try {
        const maKH = req.user?.maKH;
        const maTaiKhoan = req.user?.maTaiKhoan;

        let customer = null;
        if (maKH) {
            customer = await Customer.getById(maKH);
        }
        if (!customer && maTaiKhoan) {
            customer = await Customer.getByAccountId(maTaiKhoan);
        }

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin khách hàng liên kết với tài khoản này.'
            });
        }

        // Thống kê lịch sử gắn bó cùng Hotel
        const [[bookingStats]] = await pool.query(
            `SELECT 
                COUNT(*) AS totalBookings,
                SUM(CASE WHEN TrangThai = 'COMPLETED' THEN 1 ELSE 0 END) AS completedStays,
                SUM(CASE WHEN TrangThai = 'CONFIRMED' OR TrangThai = 'CHECKED_IN' THEN 1 ELSE 0 END) AS activeBookings
             FROM DAT_PHONG
             WHERE MaKH = ?`,
            [customer.MaKH]
        );

        const [[invoiceStats]] = await pool.query(
            `SELECT IFNULL(SUM(HD.TongTien), 0) AS totalSpend
             FROM HOA_DON HD
             JOIN LUU_TRU LT ON HD.MaLuuTru = LT.MaLuuTru
             JOIN DAT_PHONG DP ON LT.MaDatPhong = DP.MaDatPhong
             WHERE DP.MaKH = ? AND HD.TrangThai = 'PAID'`,
            [customer.MaKH]
        );

        const totalSpend = Number(invoiceStats.totalSpend || 0);
        const completedStays = Number(bookingStats.completedStays || 0);

        let membershipTier = 'Hạng Tiêu Chuẩn';
        let discountRate = 0;
        if (totalSpend >= 20000000 || completedStays >= 5) {
            membershipTier = 'Hội Viên Kim Cương (Diamond)';
            discountRate = 15;
        } else if (totalSpend >= 8000000 || completedStays >= 2) {
            membershipTier = 'Hội Viên Vàng (Gold)';
            discountRate = 10;
        } else if (totalSpend > 0 || completedStays >= 1) {
            membershipTier = 'Hội Viên Bạc (Silver)';
            discountRate = 5;
        }

        return res.status(200).json({
            success: true,
            data: {
                ...customer,
                stats: {
                    totalBookings: Number(bookingStats.totalBookings || 0),
                    completedStays,
                    activeBookings: Number(bookingStats.activeBookings || 0),
                    totalSpend,
                    membershipTier,
                    discountRate
                }
            }
        });
    } catch (err) {
        sendError(res, err);
    }
}

async function updateMyProfile(req, res) {
    try {
        const maKH = req.user?.maKH;
        const maTaiKhoan = req.user?.maTaiKhoan;

        let customer = null;
        if (maKH) {
            customer = await Customer.getById(maKH);
        }
        if (!customer && maTaiKhoan) {
            customer = await Customer.getByAccountId(maTaiKhoan);
        }

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ khách hàng để cập nhật.'
            });
        }

        const { hoTen, cccd, soDienThoai, email, diaChi, ngaySinh, gioiTinh, quocTich } = req.body || {};

        if (hoTen !== undefined && !hoTen.trim()) {
            return res.status(400).json({ success: false, message: 'Họ và tên không được để trống.' });
        }
        if (cccd !== undefined && !cccd.trim()) {
            return res.status(400).json({ success: false, message: 'CCCD/Hộ chiếu không được để trống.' });
        }
        if (soDienThoai !== undefined && !soDienThoai.trim()) {
            return res.status(400).json({ success: false, message: 'Số điện thoại không được để trống.' });
        }

        const updated = await Customer.update(customer.MaKH, {
            hoTen: hoTen !== undefined ? hoTen.trim() : customer.HoTen,
            cccd: cccd !== undefined ? cccd.trim() : customer.CCCD,
            soDienThoai: soDienThoai !== undefined ? soDienThoai.trim() : customer.SoDienThoai,
            email: email !== undefined ? email.trim() : customer.Email,
            diaChi: diaChi !== undefined ? diaChi.trim() : customer.DiaChi,
            ngaySinh: ngaySinh !== undefined ? ngaySinh : customer.NgaySinh,
            gioiTinh: gioiTinh !== undefined ? gioiTinh : customer.GioiTinh,
            quocTich: quocTich !== undefined ? quocTich.trim() : customer.QuocTich
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin cá nhân thành công.',
            data: updated
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            err.status = 409;
            err.message = 'Số CCCD hoặc số điện thoại này đã được sử dụng bởi khách hàng khác.';
        }
        sendError(res, err);
    }
}

module.exports = {
    listCustomers,
    searchCustomers,
    createCustomer,
    getMyProfile,
    updateMyProfile
};