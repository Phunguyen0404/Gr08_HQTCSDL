const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/search', customerController.searchCustomers);
router.post('/', customerController.createCustomer);

module.exports = router;
