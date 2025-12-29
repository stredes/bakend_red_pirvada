const ordersService = require('../services/orders.service');

async function createOrder(req, res) {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items required' });
  }

  const result = await ordersService.createOrder(req.user.email, req.body);
  return res.status(201).json(result);
}

module.exports = { createOrder };
