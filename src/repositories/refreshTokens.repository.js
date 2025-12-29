const { db, admin } = require('../config/firebase');

function refreshCollection() {
  return db.collection('refresh_tokens');
}

async function saveRefreshToken(payload) {
  await refreshCollection().doc(payload.jti).set({
    ...payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function getRefreshToken(jti) {
  const snapshot = await refreshCollection().doc(jti).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function revokeRefreshToken(jti) {
  await refreshCollection().doc(jti).delete();
}

async function revokeAllForUser(email) {
  const snapshot = await refreshCollection().where('email', '==', email).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

module.exports = {
  saveRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
  revokeAllForUser
};
