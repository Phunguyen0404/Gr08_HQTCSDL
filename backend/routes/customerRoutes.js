const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile', authMiddleware, customerController.getMyProfile);
router.put('/profile', authMiddleware, customerController.updateMyProfile);

router.get('/', customerController.listCustomers);
router.get('/search', customerController.searchCustomers);
router.post('/', customerController.createCustomer);

module.exports = router;
