const { v4: uuidv4 } = require('uuid');
const productsRepo = require('../repositories/products.repository');
const { normalizeEmail } = require('../utils/normalize');

async function listProducts({ providerEmail, page, pageSize }) {
  const normalized = normalizeEmail(providerEmail);
  return productsRepo.listProducts({
    providerEmail: normalized || null,
    page,
    pageSize
  });
}

async function getProduct(id) {
  const product = await productsRepo.getProductById(id);
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
}

async function createProduct(payload, requester) {
  const ownerEmail = requester.role === 'root'
    ? normalizeEmail(payload.providerEmail || requester.email)
    : requester.email;

  const id = uuidv4();
  const data = {
    nombre: payload.nombre.trim(),
    precioCLP: Number(payload.precioCLP),
    unidad: payload.unidad.trim(),
    descripcion: (payload.descripcion || '').trim(),
    imagenRes: 0,
    imagenUri: payload.imagenUri || '',
    providerEmail: ownerEmail
  };

  await productsRepo.createProduct(id, data);
  return { id, ...data };
}

async function updateProduct(id, payload, requester) {
  const existing = await productsRepo.getProductById(id);
  if (!existing) {
    throw new Error('Product not found');
  }

  if (requester.role !== 'root' && existing.providerEmail !== requester.email) {
    throw new Error('Forbidden');
  }

  const updates = {};
  ['nombre', 'precioCLP', 'unidad', 'descripcion', 'imagenUri'].forEach((key) => {
    if (payload[key] != null) {
      updates[key] = key === 'precioCLP' ? Number(payload[key]) : payload[key];
    }
  });

  await productsRepo.updateProduct(id, updates);
  return { success: true };
}

async function deleteProduct(id, requester) {
  const existing = await productsRepo.getProductById(id);
  if (!existing) {
    throw new Error('Product not found');
  }

  if (requester.role !== 'root' && existing.providerEmail !== requester.email) {
    throw new Error('Forbidden');
  }

  await productsRepo.deleteProduct(id);
  return { success: true };
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
