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

        // Tài khoản này chưa có hồ sơ - kiểm tra CCCD đã tồn tại trong hệ thống
        // chưa TRƯỚC khi tạo mới. Nếu không kiểm tra, một khách lỡ đăng ký thêm
        // tài khoản thứ 2/3 (ví dụ quên mật khẩu) sẽ luôn bị lỗi trùng CCCD và
        // không bao giờ tạo được hồ sơ để đặt phòng.
        const trungCCCD = await Customer.getByCCCD(cccd);

        if (trungCCCD) {
            if (!trungCCCD.MaTaiKhoan) {
                // Hồ sơ có sẵn (ví dụ do lễ tân tạo tay) nhưng chưa gắn tài khoản
                // nào -> gắn luôn vào tài khoản đang đăng nhập thay vì báo lỗi.
                const linked = await Customer.linkToAccount(trungCCCD.MaKH, maTaiKhoan, {
                    hoTen, soDienThoai, email, ngaySinh, gioiTinh, diaChi
                });
                return res.status(200).json({
                    success: true,
                    data: linked,
                    message: 'Đã liên kết hồ sơ khách hàng có sẵn với tài khoản của bạn'
                });
            }

            // Hồ sơ đã gắn với một tài khoản khác rồi -> không cho tạo trùng.
            const error = new Error(
                'Số CCCD này đã được đăng ký bởi một tài khoản khác. Vui lòng đăng nhập bằng tài khoản cũ hoặc liên hệ lễ tân để được hỗ trợ.'
            );
            error.status = 409;
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