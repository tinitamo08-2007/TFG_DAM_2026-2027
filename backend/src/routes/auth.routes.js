// src/routes/auth.routes.js
// Capa de RUTAS: indica qué dirección llama a qué controlador.

const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', authController.registrar);

// POST /api/v1/auth/login
router.post('/login', authController.iniciarSesion);

module.exports = router;
