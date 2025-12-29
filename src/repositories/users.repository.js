const { db } = require('../config/firebase');

function usersCollection() {
  return db.collection('users');
}

async function getUserByEmail(email) {
  const snapshot = await usersCollection().doc(email).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function createUser(email, data) {
  await usersCollection().doc(email).set(data);
}

async function updateUser(email, data) {
  await usersCollection().doc(email).update(data);
}

async function deleteUser(email) {
  await usersCollection().doc(email).delete();
}

async function getUsersByRole(role) {
  let query = usersCollection();
  if (role) {
    query = query.where('role', '==', role);
  }
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.data());
}

async function findByRut(rut) {
  const snapshot = await usersCollection().where('rut', '==', rut).limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0].data();
}

module.exports = {
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  findByRut
};
