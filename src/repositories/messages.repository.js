const { db } = require('../config/firebase');

async function createMessage(message) {
  const docRef = await db.collection('messages').add(message);
  return { id: docRef.id, ...message };
}

async function listInbox(email, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const snapshot = await db.collection('messages')
    .where('receiverEmail', '==', email)
    .orderBy('timestamp', 'desc')
    .offset(offset)
    .limit(pageSize)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function listThread(email, page = 1, pageSize = 50) {
  const offset = (page - 1) * pageSize;
  const snapshot = await db.collection('messages')
    .where('participants', 'array-contains', email)
    .orderBy('timestamp', 'desc')
    .offset(offset)
    .limit(pageSize)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

module.exports = { createMessage, listInbox, listThread };
