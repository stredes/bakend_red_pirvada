const express = require('express');
const ordersController = require('../controllers/orders.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, ordersController.createOrder);

module.exports = router;
