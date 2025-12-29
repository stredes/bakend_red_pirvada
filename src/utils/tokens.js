const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { nanoid } = require('nanoid');
const { JWT_SECRET, REFRESH_JWT_SECRET, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
      name: user.name || ''
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function signRefreshToken(user) {
  const jti = nanoid();
  const token = jwt.sign(
    {
      sub: user.email,
      jti
    },
    REFRESH_JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
  return { token, jti };
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_JWT_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken
};
