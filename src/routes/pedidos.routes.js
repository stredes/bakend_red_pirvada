const express = require('express');
const pedidosController = require('../controllers/pedidos.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, pedidosController.createPedido);
router.get('/mis', authenticateToken, pedidosController.listMisPedidos);
router.get('/proveedor', authenticateToken, pedidosController.listPedidosProveedor);
router.get('/proveedor/pendientes', authenticateToken, pedidosController.listPedidosProveedorPendientes);
router.get('/proveedor/listos-despacho', authenticateToken, pedidosController.listPedidosProveedorListos);
router.get('/counts/pendientes', authenticateToken, pedidosController.countPendientes);
router.get('/counts/notificaciones', authenticateToken, pedidosController.countNotificaciones);
router.get('/:pedidoId', authenticateToken, pedidosController.getPedido);
router.patch('/:pedidoId/metodo-pago', authenticateToken, pedidosController.updateMetodoPago);
router.patch('/:pedidoId/estado', authenticateToken, pedidosController.updateEstado);
router.post('/:pedidoId/confirmar', authenticateToken, pedidosController.confirmarPedido);
router.post('/:pedidoId/pagado', authenticateToken, pedidosController.marcarPagado);
router.post('/:pedidoId/listo-despacho', authenticateToken, pedidosController.marcarListoDespacho);
router.post('/:pedidoId/en-camino', authenticateToken, pedidosController.marcarEnCamino);
router.post('/:pedidoId/entregado', authenticateToken, pedidosController.marcarEntregado);
router.post('/:pedidoId/cancelar', authenticateToken, pedidosController.cancelarPedido);

module.exports = router;
