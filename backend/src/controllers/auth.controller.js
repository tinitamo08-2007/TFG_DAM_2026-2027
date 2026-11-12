// src/controllers/auth.controller.js
// Capa de CONTROLADORES: recibe la petición, llama al servicio y responde.

const authService = require('../services/auth.service');

async function registrar(req, res) {
  try {
    const usuario = await authService.registrar(req.body);
    // 201 = creado correctamente
    res.status(201).json(usuario);
  } catch (error) {
    if (error.status) {
      // Error previsto (datos mal, correo repetido...)
      return res.status(error.status).json({ mensaje: error.message, campos: error.campos });
    }
    // Error inesperado: lo mostramos en la consola, pero al usuario no le damos detalles
    console.error('Error en el registro:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

// HU-02: inicio de sesión
async function iniciarSesion(req, res) {
  try {
    const resultado = await authService.iniciarSesion(req.body);
    res.status(200).json(resultado);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ mensaje: error.message, campos: error.campos });
    }
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
}

module.exports = { registrar, iniciarSesion };
