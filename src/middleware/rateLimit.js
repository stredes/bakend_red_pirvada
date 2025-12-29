const rateLimit = require('express-rate-limit');
const {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_AUTH_MAX,
  RATE_LIMIT_MESSAGES_MAX,
  RATE_LIMIT_CONTACT_MAX
} = require('../config/env');

function createLimiter(max, message) {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message }
  });
}

const authLimiter = createLimiter(RATE_LIMIT_AUTH_MAX, 'Too many auth attempts');
const messagesLimiter = createLimiter(RATE_LIMIT_MESSAGES_MAX, 'Too many messages');
const contactLimiter = createLimiter(RATE_LIMIT_CONTACT_MAX, 'Too many contact requests');

module.exports = {
  authLimiter,
  messagesLimiter,
  contactLimiter
};
