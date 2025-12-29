const { db, admin } = require('../config/firebase');

async function createFriendRequest(payload) {
  const docRef = await db.collection('friend_requests').add(payload);
  return { id: docRef.id, request: payload };
}

async function listIncomingRequests(email) {
  const snapshot = await db.collection('friend_requests')
    .where('receiverEmail', '==', email)
    .where('status', '==', 'PENDIENTE')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function listOutgoingRequests(email) {
  const snapshot = await db.collection('friend_requests')
    .where('senderEmail', '==', email)
    .where('status', '==', 'PENDIENTE')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getRequestById(id) {
  const snapshot = await db.collection('friend_requests').doc(id).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function updateRequest(id, payload) {
  await db.collection('friend_requests').doc(id).update(payload);
}

async function createFriendPairs(pairs) {
  const batch = db.batch();
  pairs.forEach((item) => {
    const docId = `${item.userEmail}__${item.friendEmail}`;
    batch.set(db.collection('friends').doc(docId), {
      ...item,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
}

async function listFriends(email) {
  const snapshot = await db.collection('friends')
    .where('userEmail', '==', email)
    .get();

  return snapshot.docs.map((doc) => doc.data());
}

module.exports = {
  createFriendRequest,
  listIncomingRequests,
  listOutgoingRequests,
  getRequestById,
  updateRequest,
  createFriendPairs,
  listFriends
};
