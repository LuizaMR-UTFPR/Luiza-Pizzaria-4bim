const express = require('express');
const router = express.Router();
const gerenteController = require('../controllers/gerenteController');

router.get('/', gerenteController.listarGerentes);
router.post('/', gerenteController.criarGerente);
router.get('/:id', gerenteController.obterGerente);
router.delete('/:id', gerenteController.deletarGerente);

module.exports = router;
