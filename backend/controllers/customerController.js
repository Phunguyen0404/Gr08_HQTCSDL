const Customer = require('../models/Customer');

function sendError(res, err) {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        data: null,
        message: status === 500 ? 'Lỗi server' : err.message
    });
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

/** Lấy hồ sơ khách hàng của tài khoản đang đăng nhập (dùng cho luồng đặt phòng online). */
async function getMyProfile(req, res) {
    try {
        const maTaiKhoan = req.user?.maTaiKhoan;
        const customer = await Customer.getByMaTaiKhoan(maTaiKhoan);

        res.status(200).json({
            success: true,
            data: customer,
            message: customer ? 'Đã tìm thấy hồ sơ khách hàng' : 'Tài khoản chưa có hồ sơ khách hàng'
        });
    } catch (err) {
        sendError(res, err);
    }
}

/** Tạo mới hoặc cập nhật hồ sơ khách hàng và liên kết với tài khoản đang đăng nhập. */
async function saveMyProfile(req, res) {
    try {
        const maTaiKhoan = req.user?.maTaiKhoan;
        const { hoTen, cccd, soDienThoai, email, ngaySinh, gioiTinh, diaChi } = req.body || {};

        if (!hoTen || !soDienThoai) {
            const error = new Error('Họ tên và số điện thoại là bắt buộc');
            error.status = 400;
            throw error;
        }

        const existing = await Customer.getByMaTaiKhoan(maTaiKhoan);

        if (existing) {
            const updated = await Customer.update(existing.MaKH, {
                hoTen, soDienThoai, email, ngaySinh, gioiTinh, diaChi
            });
            return res.status(200).json({ success: true, data: updated, message: 'Cập nhật hồ sơ thành công' });
        }

        if (!cccd) {
            const error = new Error('Số CCCD là bắt buộc khi tạo hồ sơ mới');
            error.status = 400;
            throw error;
        }

        const customer = await Customer.create({
            hoTen, cccd, soDienThoai, email, ngaySinh, gioiTinh, diaChi, maTaiKhoan
        });

        res.status(201).json({ success: true, data: customer, message: 'Tạo hồ sơ khách hàng thành công' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            err.status = 409;
            err.message = 'Số CCCD này đã tồn tại trong hệ thống.';
        }
        sendError(res, err);
    }
}

module.exports = {
    searchCustomers,
    createCustomer,
    getMyProfile,
    saveMyProfile
};