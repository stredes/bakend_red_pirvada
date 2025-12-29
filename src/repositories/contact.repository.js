const { db } = require('../config/firebase');

async function createContactMessage(payload) {
  const docRef = await db.collection('contact_messages').add(payload);
  return { id: docRef.id, message: payload };
}

async function listContactMessages(page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const snapshot = await db.collection('contact_messages')
    .orderBy('fecha', 'desc')
    .offset(offset)
    .limit(pageSize)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function updateContactMessage(id, payload) {
  await db.collection('contact_messages').doc(id).update(payload);
}

async function deleteContactMessage(id) {
  await db.collection('contact_messages').doc(id).delete();
}

module.exports = {
  createContactMessage,
  listContactMessages,
  updateContactMessage,
  deleteContactMessage
};
