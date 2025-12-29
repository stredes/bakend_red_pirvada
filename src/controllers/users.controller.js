const usersService = require('../services/users.service');
const { ROOT_EMAIL } = require('../config/env');
const { normalizeEmail } = require('../utils/normalize');

async function listUsers(req, res) {
  const users = await usersService.listUsers(req.query.role);
  return res.json({ users });
}

async function getUser(req, res) {
  try {
    const requestedEmail = normalizeEmail(req.params.email);
    if (
      req.user.role !== 'root' &&
      req.user.role !== 'admin' &&
      req.user.email !== requestedEmail
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await usersService.getUser(requestedEmail);
    return res.json({ user });
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const requestedEmail = normalizeEmail(req.params.email);
    if (req.user.role !== 'root' && req.user.email !== requestedEmail) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await usersService.updateUser(requestedEmail, req.body, req.user);
    return res.json(result);
  } catch (err) {
    if (err.message === 'No updates provided') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Update failed' });
  }
}

async function createAdmin(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await usersService.createAdmin({ name, email, password });
    return res.status(201).json({ user });
  } catch (err) {
    if (err.message === 'Email already exists') {
      return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Create admin failed' });
  }
}

async function deleteUser(req, res) {
  const email = normalizeEmail(req.params.email);
  if (email === ROOT_EMAIL) {
    return res.status(400).json({ error: 'Cannot delete root' });
  }
  await usersService.deleteUser(email);
  return res.json({ success: true });
}

module.exports = {
  listUsers,
  getUser,
  updateUser,
  createAdmin,
  deleteUser
};
