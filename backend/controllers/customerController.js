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

module.exports = {
    listCustomers,
    searchCustomers,
    createCustomer
};