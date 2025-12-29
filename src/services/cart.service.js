const cartRepo = require('../repositories/cart.repository');
const productsRepo = require('../repositories/products.repository');

async function getCart(email) {
  const cart = await cartRepo.getCart(email);
  const totals = await computeTotals(cart.items || []);
  return { items: cart.items || [], ...totals };
}

async function upsertItem(email, { productId, qty }) {
  const cart = await cartRepo.getCart(email);
  const items = cart.items || [];
  const filtered = items.filter((item) => item.productId !== productId);

  if (Number(qty) > 0) {
    await assertStock(productId, Number(qty));
    filtered.push({ productId, qty: Number(qty) });
  }

  await cartRepo.saveCart(email, filtered);
  const totals = await computeTotals(filtered);
  return { items: filtered, ...totals };
}

async function deleteItem(email, productId) {
  const cart = await cartRepo.getCart(email);
  const items = cart.items || [];
  const filtered = items.filter((item) => item.productId !== productId);

  await cartRepo.saveCart(email, filtered);
  const totals = await computeTotals(filtered);
  return { items: filtered, ...totals };
}

async function clearCart(email) {
  await cartRepo.saveCart(email, []);
  return { success: true, items: [], subtotalCLP: 0, totalCLP: 0 };
}

async function computeTotals(items) {
  if (!items.length) return { subtotalCLP: 0, totalCLP: 0 };
  const productIds = items.map((item) => item.productId);
  const products = await productsRepo.getProductsByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));
  const subtotal = items.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    if (!product) return sum;
    return sum + Number(product.precioCLP || 0) * Number(item.qty || 0);
  }, 0);
  return { subtotalCLP: subtotal, totalCLP: subtotal };
}

async function assertStock(productId, qty) {
  const product = await productsRepo.getProductById(productId);
  if (!product) {
    throw new Error('Product not found');
  }
  if (typeof product.stock === 'number' && qty > product.stock) {
    throw new Error('Insufficient stock');
  }
}

module.exports = { getCart, upsertItem, deleteItem, clearCart };
