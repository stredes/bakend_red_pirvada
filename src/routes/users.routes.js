const express = require('express');
const usersController = require('../controllers/users.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin', 'root'), usersController.listUsers);
router.get('/:email', authenticateToken, usersController.getUser);
router.patch('/:email', authenticateToken, usersController.updateUser);
router.post('/admin', authenticateToken, requireRole('root'), usersController.createAdmin);
router.delete('/:email', authenticateToken, requireRole('root'), usersController.deleteUser);

module.exports = router;
