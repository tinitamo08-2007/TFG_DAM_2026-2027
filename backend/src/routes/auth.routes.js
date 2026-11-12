// src/routes/auth.routes.js
// Capa de RUTAS: indica qué dirección llama a qué controlador.

const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', authController.registrar);

// POST /api/v1/auth/login
router.post('/login', authController.iniciarSesion);

// POST /api/v1/auth/refresh  (HU-03)
router.post('/refresh', authController.refrescar);

// POST /api/v1/auth/logout  (HU-03)
router.post('/logout', authController.cerrarSesion);

module.exports = router;
