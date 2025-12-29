const ordersRepo = require('../repositories/orders.repository');

async function createOrder(email, payload) {
  const order = {
    userEmail: email,
    items: payload.items,
    totalCLP: Number(payload.totalCLP || 0),
    status: 'PENDING'
  };

  return ordersRepo.createOrder(order);
}

module.exports = { createOrder };
