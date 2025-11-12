const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Cadastro
router.post('/register', authController.registerUser);

// Login
router.post('/login', authController.loginUser);

// Dados do usuário logado
router.get('/me', authController.verifyToken, authController.getProfile);

module.exports = router;
