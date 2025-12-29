const express = require('express');
const contactController = require('../controllers/contact.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', contactLimiter, contactController.createContact);
router.get('/admin', authenticateToken, requireRole('admin', 'root'), contactController.listContacts);
router.patch('/admin/:id', authenticateToken, requireRole('admin', 'root'), contactController.updateContact);
router.delete('/admin/:id', authenticateToken, requireRole('admin', 'root'), contactController.deleteContact);

module.exports = router;
