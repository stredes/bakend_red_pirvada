const { db, admin } = require('../config/firebase');

async function createOrder(data) {
  const payload = {
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  const docRef = await db.collection('orders').add(payload);
  return { id: docRef.id, order: payload };
}

module.exports = { createOrder };
