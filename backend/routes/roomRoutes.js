const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
// const roomController = require('../controllers/roomController');

const router = express.Router();

// Tất cả các route phòng yêu cầu đăng nhập và role ADMIN hoặc STAFF
router.use(authMiddleware, authorizeRoles('ADMIN', 'STAFF'));

// TODO: Thêm các endpoint phòng khi roomController sẵn sàng
// router.get('/', roomController.getAll);
// router.post('/', roomController.create);
// router.put('/:id', roomController.update);
// router.delete('/:id', roomController.remove);

module.exports = router;
