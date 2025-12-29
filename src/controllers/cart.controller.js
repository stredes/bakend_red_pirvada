const cartService = require('../services/cart.service');

async function getCart(req, res) {
  const result = await cartService.getCart(req.user.email);
  return res.json(result);
}

async function upsertItem(req, res) {
  const { productId, qty } = req.body;
  if (!productId || qty == null) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await cartService.upsertItem(req.user.email, { productId, qty });
    return res.json(result);
  } catch (err) {
    if (err.message === 'Product not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Insufficient stock') {
      return res.status(422).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Update cart failed' });
  }
}

async function deleteItem(req, res) {
  const result = await cartService.deleteItem(req.user.email, req.params.productId);
  return res.json(result);
}

async function clearCart(req, res) {
  const result = await cartService.clearCart(req.user.email);
  return res.json(result);
}

module.exports = { getCart, upsertItem, deleteItem, clearCart };
