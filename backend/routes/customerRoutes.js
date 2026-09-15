const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
// const customerController = require('../controllers/customerController');

const router = express.Router();

// Quản lý khách hàng chỉ dành cho ADMIN
router.use(authMiddleware, authorizeRoles('ADMIN'));

// TODO: Thêm các endpoint khách hàng khi customerController sẵn sàng
// router.get('/', customerController.getAll);
// router.post('/', customerController.create);
// router.put('/:id', customerController.update);
// router.delete('/:id', customerController.remove);

module.exports = router;
