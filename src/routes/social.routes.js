const express = require('express');
const socialController = require('../controllers/social.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/requests', authenticateToken, socialController.createRequest);
router.get('/requests/incoming', authenticateToken, socialController.listIncoming);
router.get('/requests/outgoing', authenticateToken, socialController.listOutgoing);
router.post('/requests/:id/accept', authenticateToken, socialController.acceptRequest);
router.post('/requests/:id/reject', authenticateToken, socialController.rejectRequest);
router.get('/friends', authenticateToken, socialController.listFriends);

module.exports = router;
