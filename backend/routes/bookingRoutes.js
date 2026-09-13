const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
// const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Tất cả các role đã đăng nhập đều có thể xem/tạo đặt phòng
router.use(authMiddleware, authorizeRoles('ADMIN', 'STAFF', 'CUSTOMER'));

// TODO: Thêm các endpoint đặt phòng khi bookingController sẵn sàng
// router.get('/', bookingController.getAll);
// router.post('/', bookingController.create);
// router.put('/:id', bookingController.update);
// router.delete('/:id', bookingController.remove);

module.exports = router;
