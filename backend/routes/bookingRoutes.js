const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.get('/available-rooms', bookingController.getAvailableRooms);
router.get('/', bookingController.listBookings);
router.get('/:id', bookingController.getBooking);
router.post('/', bookingController.createBooking);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.post('/:id/cancel', bookingController.cancelBooking);
router.post('/:id/check-in', bookingController.checkInBooking);
router.post('/:id/check-out', bookingController.checkOutBooking);

module.exports = router;
