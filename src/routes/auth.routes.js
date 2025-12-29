const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticateToken, authController.me);
router.post('/verify-email', authController.verifyEmail);
router.post('/reset-password', authenticateToken, authController.resetPassword);
router.post('/refresh', authLimiter, authController.refresh);

module.exports = router;
