const express = require('express');
const router = express.Router();
const imagemController = require('../controllers/imagemController');

// CRUD routes
router.get('/crud', imagemController.abrirCrudImagens);
router.get('/listar', imagemController.listarImagens);
router.get('/pizza/:pizzaId', imagemController.obterImagemPizza);
router.get('/:id', imagemController.obterImagemPorId);
router.post('/salvar', imagemController.salvarImagem);
router.put('/:id', imagemController.atualizarImagem);
router.delete('/:id', imagemController.deletarImagem);

module.exports = router;
