const express = require('express');
const router = express.Router();
const pizzaSaborController = require('../controllers/pizzaSaborController');

router.get('/', pizzaSaborController.listarPizzaSabores);
router.post('/', pizzaSaborController.criarPizzaSabor);
router.delete('/:pizza_id_pizza/:sabor_id_sabor', pizzaSaborController.deletarPizzaSabor);

module.exports = router;
