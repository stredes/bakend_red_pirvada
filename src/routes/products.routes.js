const express = require('express');
const productsController = require('../controllers/products.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', productsController.listProducts);
router.get('/:id', productsController.getProduct);
router.post('/', authenticateToken, requireRole('admin', 'root', 'provider'), productsController.createProduct);
router.put('/:id', authenticateToken, requireRole('admin', 'root', 'provider'), productsController.updateProduct);
router.delete('/:id', authenticateToken, requireRole('admin', 'root', 'provider'), productsController.deleteProduct);

module.exports = router;
