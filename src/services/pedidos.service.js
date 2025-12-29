const { v4: uuidv4 } = require('uuid');
const pedidosRepo = require('../repositories/pedidos.repository');
const { normalizeEmail } = require('../utils/normalize');

const ESTADO_PEDIDO = {
  PENDIENTE: 'PENDIENTE',
  CONFIRMADO: 'CONFIRMADO',
  ESPERANDO_PAGO: 'ESPERANDO_PAGO',
  PAGADO: 'PAGADO',
  LISTO_DESPACHO: 'LISTO_DESPACHO',
  EN_CAMINO: 'EN_CAMINO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO'
};

function nowMillis() {
  return Date.now();
}

function ensurePedidoAccess(pedido, requester) {
  if (requester.role === 'root' || requester.role === 'admin') return true;
  return pedido.compradorEmail === requester.email || pedido.proveedorEmail === requester.email;
}

function isBuyer(pedido, requester) {
  return pedido.compradorEmail === requester.email;
}

function isProvider(pedido, requester) {
  return pedido.proveedorEmail === requester.email;
}

function canTransition(current, next, pedido, requester) {
  if (requester.role === 'root' || requester.role === 'admin') return true;

  if (next === ESTADO_PEDIDO.CANCELADO) {
    if (isBuyer(pedido, requester)) return current === ESTADO_PEDIDO.PENDIENTE;
    if (isProvider(pedido, requester)) return [ESTADO_PEDIDO.PENDIENTE, ESTADO_PEDIDO.CONFIRMADO].includes(current);
  }

  if (next === ESTADO_PEDIDO.CONFIRMADO) {
    return isProvider(pedido, requester) && current === ESTADO_PEDIDO.PENDIENTE;
  }

  if (next === ESTADO_PEDIDO.PAGADO) {
    return isBuyer(pedido, requester) && [ESTADO_PEDIDO.CONFIRMADO, ESTADO_PEDIDO.ESPERANDO_PAGO].includes(current);
  }

  if (next === ESTADO_PEDIDO.LISTO_DESPACHO) {
    return isProvider(pedido, requester) && current === ESTADO_PEDIDO.PAGADO;
  }

  if (next === ESTADO_PEDIDO.EN_CAMINO) {
    return isProvider(pedido, requester) && current === ESTADO_PEDIDO.LISTO_DESPACHO;
  }

  if (next === ESTADO_PEDIDO.ENTREGADO) {
    return isBuyer(pedido, requester) && current === ESTADO_PEDIDO.EN_CAMINO;
  }

  return false;
}

async function createPedido(payload, requester) {
  const pedidoId = payload.pedidoId || uuidv4();
  const compradorEmail = requester.email;
  const proveedorEmail = normalizeEmail(payload.proveedorEmail);

  if (!proveedorEmail || !payload.detalleJson || payload.totalCLP == null) {
    throw new Error('Missing required fields');
  }

  const timestamp = nowMillis();
  const pedido = {
    pedidoId,
    compradorEmail,
    compradorNombre: payload.compradorNombre || requester.name || 'Cliente',
    proveedorEmail,
    detalleJson: payload.detalleJson,
    totalCLP: Number(payload.totalCLP),
    estado: ESTADO_PEDIDO.PENDIENTE,
    fechaPedido: timestamp,
    ultimaActualizacion: timestamp,
    metodoPago: payload.metodoPago || null,
    datosTransferencia: payload.datosTransferencia || null,
    direccionEntrega: payload.direccionEntrega || null,
    fechaDespacho: null,
    fechaEntrega: null
  };

  await pedidosRepo.createPedido(pedidoId, pedido);

  await pedidosRepo.createNotification({
    senderEmail: compradorEmail,
    senderName: pedido.compradorNombre,
    receiverEmail: proveedorEmail,
    content: `Nuevo pedido recibido de ${pedido.compradorNombre}. Total: $${pedido.totalCLP}`,
    type: 'PEDIDO_NUEVO',
    timestamp: nowMillis(),
    pedidoId,
    read: false
  });

  return pedido;
}

async function listMisPedidos(requester, options) {
  return pedidosRepo.listByComprador(requester.email, options);
}

async function listPedidosProveedor(requester, options) {
  return pedidosRepo.listByProveedor(requester.email, options);
}

async function listPedidosProveedorPorEstado(requester, estado, options) {
  return pedidosRepo.listByProveedorAndEstado(requester.email, estado, options);
}

async function getPedidoById(pedidoId, requester) {
  const pedido = await pedidosRepo.getPedidoById(pedidoId);
  if (!pedido) throw new Error('Pedido not found');
  if (!ensurePedidoAccess(pedido, requester)) throw new Error('Forbidden');
  return pedido;
}

async function updateMetodoPago(pedidoId, payload, requester) {
  const pedido = await pedidosRepo.getPedidoById(pedidoId);
  if (!pedido) throw new Error('Pedido not found');
  if (pedido.compradorEmail !== requester.email && requester.role !== 'root' && requester.role !== 'admin') {
    throw new Error('Forbidden');
  }

  if (![ESTADO_PEDIDO.CONFIRMADO, ESTADO_PEDIDO.ESPERANDO_PAGO].includes(pedido.estado)) {
    throw new Error('Invalid transition');
  }

  await pedidosRepo.updatePedido(pedidoId, {
    metodoPago: payload.metodoPago || payload.metodo || null,
    datosTransferencia: payload.datosTransferencia || '',
    estado: ESTADO_PEDIDO.ESPERANDO_PAGO,
    ultimaActualizacion: nowMillis()
  });

  await pedidosRepo.createAudit({
    pedidoId,
    actorEmail: requester.email,
    from: pedido.estado,
    to: ESTADO_PEDIDO.ESPERANDO_PAGO,
    reason: payload.metodoPago || payload.metodo || null
  });

  return { success: true };
}

async function updateEstado(pedidoId, estado, requester, payload = {}) {
  const pedido = await pedidosRepo.getPedidoById(pedidoId);
  if (!pedido) throw new Error('Pedido not found');
  if (!ensurePedidoAccess(pedido, requester)) throw new Error('Forbidden');
  if (!canTransition(pedido.estado, estado, pedido, requester)) throw new Error('Invalid transition');

  const updates = { estado, ultimaActualizacion: nowMillis() };
  const auditReason = estado === ESTADO_PEDIDO.CANCELADO ? payload.motivoCancelacion || payload.motivo || null : null;

  if (estado === ESTADO_PEDIDO.EN_CAMINO) {
    updates.fechaDespacho = nowMillis();
  }
  if (estado === ESTADO_PEDIDO.ENTREGADO) {
    updates.fechaEntrega = nowMillis();
  }
  if (estado === ESTADO_PEDIDO.CANCELADO) {
    if (!payload.motivoCancelacion && !payload.motivo) {
      throw new Error('Cancel reason required');
    }
    updates.motivoCancelacion = payload.motivoCancelacion || payload.motivo;
    updates.canceladoPor = requester.email;
  }

  await pedidosRepo.updatePedido(pedidoId, updates);
  await pedidosRepo.createAudit({
    pedidoId,
    actorEmail: requester.email,
    from: pedido.estado,
    to: estado,
    reason: auditReason
  });

  if (estado === ESTADO_PEDIDO.LISTO_DESPACHO) {
    await pedidosRepo.createNotification({
      senderEmail: pedido.proveedorEmail,
      senderName: 'Proveedor',
      receiverEmail: pedido.compradorEmail,
      content: '📦 Tu pedido está listo y será enviado pronto.',
      type: 'PEDIDO_LISTO',
      timestamp: nowMillis(),
      pedidoId,
      read: false
    });
  }

  if (estado === ESTADO_PEDIDO.EN_CAMINO) {
    await pedidosRepo.createNotification({
      senderEmail: pedido.proveedorEmail,
      senderName: 'Proveedor',
      receiverEmail: pedido.compradorEmail,
      content: '🚚 ¡Tu pedido está en camino! Confirma la recepción al recibirlo.',
      type: 'PEDIDO_EN_CAMINO',
      timestamp: nowMillis(),
      pedidoId,
      read: false
    });
  }

  if (estado === ESTADO_PEDIDO.ENTREGADO) {
    await pedidosRepo.createNotification({
      senderEmail: pedido.compradorEmail,
      senderName: pedido.compradorNombre || 'Cliente',
      receiverEmail: pedido.proveedorEmail,
      content: `✅ ${pedido.compradorNombre || 'El cliente'} confirmó la recepción. Total: $${pedido.totalCLP}`,
      type: 'PEDIDO_ENTREGADO',
      timestamp: nowMillis(),
      pedidoId,
      read: false
    });
  }

  return { success: true };
}

async function countPendientesProveedor(requester) {
  const total = await pedidosRepo.countByProveedorAndEstado(requester.email, ESTADO_PEDIDO.PENDIENTE);
  return { count: total };
}

async function countNotificacionesComprador(requester) {
  const total = await pedidosRepo.countNotificacionesComprador(requester.email);
  return { count: total };
}

module.exports = {
  ESTADO_PEDIDO,
  createPedido,
  listMisPedidos,
  listPedidosProveedor,
  listPedidosProveedorPorEstado,
  getPedidoById,
  updateMetodoPago,
  updateEstado,
  countPendientesProveedor,
  countNotificacionesComprador
};
