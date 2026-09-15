const express = require('express');
<<<<<<< HEAD
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/available-rooms', bookingController.getAvailableRooms);
router.get('/', bookingController.listBookings);
router.get('/:id', bookingController.getBooking);
router.post('/', bookingController.createBooking);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
=======
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
// const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Các role đã đăng nhập đều có thể xem/tạo đặt phòng (ADMIN, CUSTOMER)
router.use(authMiddleware, authorizeRoles('ADMIN', 'CUSTOMER'));

// TODO: Thêm các endpoint đặt phòng khi bookingController sẵn sàng
// router.get('/', bookingController.getAll);
// router.post('/', bookingController.create);
// router.put('/:id', bookingController.update);
// router.delete('/:id', bookingController.remove);

module.exports = router;
>>>>>>> feature/auth
