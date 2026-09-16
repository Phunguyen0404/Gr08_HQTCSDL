const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Nhân viên tìm khách vãng lai theo CCCD / SĐT (dùng ở walk-in booking)
router.get('/search', customerController.searchCustomers);

// Tạo hồ sơ khách vãng lai (không cần đăng nhập, dùng cho nhân viên)
router.post('/', customerController.createCustomer);

// Khách hàng đã đăng nhập: lấy hồ sơ của chính mình
router.get('/me', authMiddleware, authorizeRoles('CUSTOMER', 'ADMIN'), customerController.getMyProfile);

// Khách hàng đã đăng nhập: tạo / cập nhật hồ sơ và liên kết với tài khoản đang đăng nhập
router.post('/me', authMiddleware, authorizeRoles('CUSTOMER', 'ADMIN'), customerController.saveMyProfile);

module.exports = router;