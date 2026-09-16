const express = require('express');
const roomController = require('../controllers/roomController');

const router = express.Router();

// Route quản lý loại phòng
router.get('/room-types', roomController.listRoomTypes);
router.post('/room-types', roomController.createRoomType);
router.put('/room-types/:id', roomController.updateRoomType);
router.delete('/room-types/:id', roomController.deleteRoomType);

// Route quản lý phòng
router.get('/rooms', roomController.listRooms);
router.get('/rooms/available', roomController.getAvailableRoomsRoute);
router.get('/rooms/check-availability', roomController.checkRoomAvailability);
router.get('/rooms/:id', roomController.getRoomById);
router.post('/rooms', roomController.createRoom);
router.put('/rooms/:id', roomController.updateRoom);
router.delete('/rooms/:id', roomController.deleteRoom);

module.exports = router;
