// src/index.js
// Punto de entrada del servidor: arranca Express y define las rutas.

require('dotenv').config({ quiet: true });

const express = require('express');
const pool = require('./db');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PUERTO = process.env.PORT || 3000;

// Permite que el servidor entienda los datos que llegan en formato JSON
app.use(express.json());

// Ruta de prueba 1: comprueba que el servidor está encendido
app.get('/health', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'El servidor funciona' });
});

// Ruta de prueba 2: comprueba que el servidor llega a la base de datos
app.get('/health/db', async (req, res) => {
  try {
    // Le pedimos a PostgreSQL la hora actual: si responde, la conexión funciona
    const resultado = await pool.query('SELECT NOW() AS ahora');
    res.json({ estado: 'ok', baseDeDatos: 'conectada', ahora: resultado.rows[0].ahora });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    res.status(500).json({ estado: 'error', baseDeDatos: 'sin conexión' });
  }
});

// Rutas de autenticación (registro, y más adelante inicio de sesión)
app.use('/api/v1/auth', authRoutes);

// Arrancamos el servidor
app.listen(PUERTO, () => {
  console.log('Servidor escuchando en http://localhost:' + PUERTO);
});
