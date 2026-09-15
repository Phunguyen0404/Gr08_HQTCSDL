const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
// const invoiceController = require('../controllers/invoiceController');

const router = express.Router();

// Quản lý hóa đơn chỉ dành cho ADMIN
router.use(authMiddleware, authorizeRoles('ADMIN'));

// TODO: Thêm các endpoint hóa đơn khi invoiceController sẵn sàng
// router.get('/', invoiceController.getAll);
// router.post('/', invoiceController.create);
// router.put('/:id', invoiceController.update);

module.exports = router;
