const express = require('express');
const router = express.Router();
const pizzaController = require('../controllers/pizzaController');

// CRUD de Pizzas
router.get('/abrirCrudPizza', pizzaController.abrirCrudPizza);
router.get('/', pizzaController.listarPizzas);
router.post('/', pizzaController.criarPizza);
router.get('/:id', pizzaController.obterPizza);
router.put('/:id', pizzaController.atualizarPizza);
router.delete('/:id', pizzaController.deletarPizza);

module.exports = router;
