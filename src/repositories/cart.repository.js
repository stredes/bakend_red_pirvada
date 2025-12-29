const { db, admin } = require('../config/firebase');

function cartDoc(email) {
  return db.collection('carts').doc(email);
}

async function getCart(email) {
  const snapshot = await cartDoc(email).get();
  return snapshot.exists ? snapshot.data() : { items: [] };
}

async function saveCart(email, items) {
  await cartDoc(email).set({
    userEmail: email,
    items,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

module.exports = { getCart, saveCart };
