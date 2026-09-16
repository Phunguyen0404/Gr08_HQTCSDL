const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Công khai: ai cũng xem được phòng còn trống (giống trang tìm phòng của Vinpearl)
router.get('/available-rooms', bookingController.getAvailableRooms);

// Từ đây trở xuống cần đăng nhập (CUSTOMER hoặc ADMIN)
router.use(authMiddleware, authorizeRoles('ADMIN', 'CUSTOMER'));

router.get('/', bookingController.listBookings);
router.get('/:id', bookingController.getBooking);
router.post('/', bookingController.createBooking);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;