const { db, admin } = require('../config/firebase');

function productsCollection() {
  return db.collection('products');
}

async function listProducts({ providerEmail, page = 1, pageSize = 20 }) {
  let query = productsCollection();
  if (providerEmail) {
    query = query.where('providerEmail', '==', providerEmail);
  }
  const offset = (page - 1) * pageSize;
  const snapshot = await query.orderBy('timestamp', 'desc').offset(offset).limit(pageSize).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getProductById(id) {
  const snapshot = await productsCollection().doc(id).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function getProductsByIds(ids) {
  if (!ids.length) return [];
  const chunkSize = 10;
  const results = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const snapshot = await productsCollection().where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
    snapshot.docs.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
  }
  return results;
}

async function createProduct(id, data) {
  await productsCollection().doc(id).set({
    ...data,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function updateProduct(id, data) {
  await productsCollection().doc(id).update({
    ...data,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function deleteProduct(id) {
  await productsCollection().doc(id).delete();
}

module.exports = {
  listProducts,
  getProductById,
  getProductsByIds,
  createProduct,
  updateProduct,
  deleteProduct
};
