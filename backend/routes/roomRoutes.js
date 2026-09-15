const express = require('express');
<<<<<<< HEAD
const roomController = require('../controllers/roomController');

const router = express.Router();

// Route quản lý loại phòng

router.get('/room-types', roomController.listRoomTypes);
router.post('/room-types', roomController.createRoomType);
router.put('/room-types/:id', roomController.updateRoomType);
router.delete('/room-types/:id', roomController.deleteRoomType);

router.get('/rooms', roomController.listRooms);
router.get('/rooms/:id', roomController.getRoomById);
router.post('/rooms', roomController.createRoom);
router.put('/rooms/:id', roomController.updateRoom);
router.delete('/rooms/:id', roomController.deleteRoom);
router.get('/rooms/available', roomController.getAvailableRoomsRoute);
router.get('/rooms/check-availability', roomController.checkRoomAvailability);
=======
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
// const roomController = require('../controllers/roomController');

const router = express.Router();

// Tất cả các route phòng yêu cầu đăng nhập và role ADMIN
router.use(authMiddleware, authorizeRoles('ADMIN'));

// TODO: Thêm các endpoint phòng khi roomController sẵn sàng
// router.get('/', roomController.getAll);
// router.post('/', roomController.create);
// router.put('/:id', roomController.update);
// router.delete('/:id', roomController.remove);
>>>>>>> feature/auth

module.exports = router;
