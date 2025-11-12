const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { verifyToken } = require('../controllers/authController');
const verificarAcessoCozinha = require('../middleware/verificarAcessoCozinha');
const verificarAcessoEntrega = require('../middleware/verificarAcessoEntrega');
const verificarPedidoCozinheiro = require('../middleware/verificarPedidoCozinheiro');

// Rotas específicas (devem vir ANTES das parametrizadas)
router.get('/abrirCrudPedido', pedidoController.abrirCrudPedido);

// Rotas protegidas para cozinheiros (e gerente mestre)
router.get('/pendentes',
  verifyToken,
  verificarAcessoCozinha,
  pedidoController.listarPedidosCozinha
);

// Rotas protegidas para entregadores (e gerente mestre)
router.get('/entregas',
  verifyToken,
  verificarAcessoEntrega,
  pedidoController.listarPedidosEntrega
);

// CRUD de Pedidos (rotas parametrizadas por último)
router.get('/', pedidoController.listarPedidos);
router.post('/', pedidoController.criarPedido);
router.get('/:id', pedidoController.obterPedido);
router.put('/:id', pedidoController.atualizarPedido);
router.delete('/:id', pedidoController.deletarPedido);

// Rotas de preparo (cozinha)
router.put('/:id/preparo',
  verifyToken,
  verificarAcessoCozinha,
  verificarPedidoCozinheiro,
  pedidoController.iniciarPreparo
);

router.put('/:id/pronto',
  verifyToken,
  verificarAcessoCozinha,
  verificarPedidoCozinheiro,
  pedidoController.marcarPronto
);

// Rotas de entrega
router.put('/:id/entrega',
  verifyToken,
  verificarAcessoEntrega,
  pedidoController.iniciarEntrega
);

router.put('/:id/entregue',
  verifyToken,
  verificarAcessoEntrega,
  pedidoController.marcarEntregue
);

module.exports = router;