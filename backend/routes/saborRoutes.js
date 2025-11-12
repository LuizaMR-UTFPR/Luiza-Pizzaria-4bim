const express = require('express');
const router = express.Router();
const saborController = require('../controllers/saborController');

// CRUD de Sabores
router.get('/abrirCrudSabor', saborController.abrirCrudSabor);
router.get('/', saborController.listarSabores);
router.post('/', saborController.criarSabor);
router.get('/:id', saborController.obterSabor);
router.put('/:id', saborController.atualizarSabor);
router.delete('/:id', saborController.deletarSabor);

module.exports = router;
