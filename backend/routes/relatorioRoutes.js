const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// Rota: mês com mais pizzas vendidas
router.get('/mes-mais-vendas', relatorioController.mesMaisVendas);

// Rota: pizzas mais vendidas
router.get('/pizzas-mais-vendidas', relatorioController.pizzasMaisVendidas);

router.get('/todos-os-meses', relatorioController.todosOsMeses);

module.exports = router;
