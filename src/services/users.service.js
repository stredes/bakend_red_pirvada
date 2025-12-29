const bcrypt = require('bcryptjs');
const { admin } = require('../config/firebase');
const { normalizeEmail } = require('../utils/normalize');
const usersRepo = require('../repositories/users.repository');

async function listUsers(role) {
  const users = await usersRepo.getUsersByRole(role);
  return users.map((user) => ({
    name: user.name,
    email: user.email,
    role: user.role,
    rut: user.rut || ''
  }));
}

async function getUser(email) {
  const user = await usersRepo.getUserByEmail(normalizeEmail(email));
  if (!user) {
    throw new Error('User not found');
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    rut: user.rut || ''
  };
}

async function updateUser(email, updates, requester) {
  const normalizedEmail = normalizeEmail(email);
  const payload = {};

  if (updates.name) payload.name = updates.name.trim();
  if (updates.rut) payload.rut = updates.rut.trim().toUpperCase();
  if (updates.role && requester.role === 'root') payload.role = updates.role;

  if (Object.keys(payload).length === 0) {
    throw new Error('No updates provided');
  }

  await usersRepo.updateUser(normalizedEmail, payload);
  return { success: true };
}

async function createAdmin({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await usersRepo.getUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('Email already exists');
  }

  const hash = await bcrypt.hash(password, 10);
  const user = {
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hash,
    role: 'admin',
    rut: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await usersRepo.createUser(normalizedEmail, user);
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    rut: user.rut
  };
}

async function deleteUser(email) {
  await usersRepo.deleteUser(normalizeEmail(email));
  return { success: true };
}

module.exports = {
  listUsers,
  getUser,
  updateUser,
  createAdmin,
  deleteUser
};
