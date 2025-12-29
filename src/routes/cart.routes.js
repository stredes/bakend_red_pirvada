const express = require('express');
const cartController = require('../controllers/cart.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, cartController.getCart);
router.post('/items', authenticateToken, cartController.upsertItem);
router.delete('/items/:productId', authenticateToken, cartController.deleteItem);
router.post('/clear', authenticateToken, cartController.clearCart);

module.exports = router;
