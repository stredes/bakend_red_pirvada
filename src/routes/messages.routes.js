const express = require('express');
const messagesController = require('../controllers/messages.controller');
const { authenticateToken } = require('../middleware/auth');
const { messagesLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', authenticateToken, messagesLimiter, messagesController.sendMessage);
router.get('/inbox', authenticateToken, messagesController.getInbox);
router.get('/thread', authenticateToken, messagesController.getThread);

module.exports = router;
