const pedidosService = require('../services/pedidos.service');

async function createPedido(req, res) {
  try {
    const pedido = await pedidosService.createPedido(req.body, req.user);
    return res.status(201).json({ pedido });
  } catch (err) {
    if (err.message === 'Missing required fields') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Create pedido failed' });
  }
}

async function listMisPedidos(req, res) {
  const pedidos = await pedidosService.listMisPedidos(req.user, parseListOptions(req));
  return res.json({ pedidos });
}

async function listPedidosProveedor(req, res) {
  const pedidos = await pedidosService.listPedidosProveedor(req.user, parseListOptions(req));
  return res.json({ pedidos });
}

async function listPedidosProveedorPendientes(req, res) {
  const pedidos = await pedidosService.listPedidosProveedorPorEstado(req.user, pedidosService.ESTADO_PEDIDO.PENDIENTE, parseListOptions(req));
  return res.json({ pedidos });
}

async function listPedidosProveedorListos(req, res) {
  const pedidos = await pedidosService.listPedidosProveedorPorEstado(req.user, pedidosService.ESTADO_PEDIDO.LISTO_DESPACHO, parseListOptions(req));
  return res.json({ pedidos });
}

async function getPedido(req, res) {
  try {
    const pedido = await pedidosService.getPedidoById(req.params.pedidoId, req.user);
    return res.json({ pedido });
  } catch (err) {
    if (err.message === 'Pedido not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Forbidden') {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Get pedido failed' });
  }
}

async function updateMetodoPago(req, res) {
  try {
    const result = await pedidosService.updateMetodoPago(req.params.pedidoId, req.body, req.user);
    return res.json(result);
  } catch (err) {
    if (err.message === 'Pedido not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Forbidden') {
      return res.status(403).json({ error: err.message });
    }
    if (err.message === 'Invalid transition') {
      return res.status(422).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Update metodo pago failed' });
  }
}

async function updateEstado(req, res) {
  try {
    const result = await pedidosService.updateEstado(req.params.pedidoId, req.body.estado, req.user, req.body);
    return res.json(result);
  } catch (err) {
    if (err.message === 'Pedido not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Forbidden') {
      return res.status(403).json({ error: err.message });
    }
    if (err.message === 'Invalid transition' || err.message === 'Cancel reason required') {
      return res.status(422).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Update estado failed' });
  }
}

async function confirmarPedido(req, res) {
  return updateEstadoByValue(req, res, pedidosService.ESTADO_PEDIDO.CONFIRMADO);
}

async function marcarPagado(req, res) {
  return updateEstadoByValue(req, res, pedidosService.ESTADO_PEDIDO.PAGADO);
}

async function marcarListoDespacho(req, res) {
  return updateEstadoByValue(req, res, pedidosService.ESTADO_PEDIDO.LISTO_DESPACHO);
}

async function marcarEnCamino(req, res) {
  return updateEstadoByValue(req, res, pedidosService.ESTADO_PEDIDO.EN_CAMINO);
}

async function marcarEntregado(req, res) {
  return updateEstadoByValue(req, res, pedidosService.ESTADO_PEDIDO.ENTREGADO);
}

async function cancelarPedido(req, res) {
  return updateEstadoByValue(req, res, pedidosService.ESTADO_PEDIDO.CANCELADO);
}

async function updateEstadoByValue(req, res, estado) {
  try {
    const result = await pedidosService.updateEstado(req.params.pedidoId, estado, req.user, req.body);
    return res.json(result);
  } catch (err) {
    if (err.message === 'Pedido not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Forbidden') {
      return res.status(403).json({ error: err.message });
    }
    if (err.message === 'Invalid transition' || err.message === 'Cancel reason required') {
      return res.status(422).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Update estado failed' });
  }
}

async function countPendientes(req, res) {
  const result = await pedidosService.countPendientesProveedor(req.user);
  return res.json(result);
}

async function countNotificaciones(req, res) {
  const result = await pedidosService.countNotificacionesComprador(req.user);
  return res.json(result);
}

function parseListOptions(req) {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
  const estado = req.query.estado || null;
  const desde = req.query.desde ? Number(req.query.desde) : null;
  const hasta = req.query.hasta ? Number(req.query.hasta) : null;
  return { page, pageSize, estado, desde, hasta };
}

module.exports = {
  createPedido,
  listMisPedidos,
  listPedidosProveedor,
  listPedidosProveedorPendientes,
  listPedidosProveedorListos,
  getPedido,
  updateMetodoPago,
  updateEstado,
  confirmarPedido,
  marcarPagado,
  marcarListoDespacho,
  marcarEnCamino,
  marcarEntregado,
  cancelarPedido,
  countPendientes,
  countNotificaciones
};
