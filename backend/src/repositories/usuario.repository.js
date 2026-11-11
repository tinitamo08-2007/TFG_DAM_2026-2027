// src/repositories/usuario.repository.js
// Capa de ACCESO A DATOS: aquí solo hay consultas SQL a la tabla usuario.

const pool = require('../db');

// Busca un usuario por su correo. Devuelve el usuario o undefined si no existe.
async function buscarPorCorreo(correo) {
  // $1 es un parámetro: así el valor nunca se pega dentro del SQL (evita inyección SQL)
  const resultado = await pool.query('SELECT id FROM usuario WHERE correo = $1', [correo]);
  return resultado.rows[0];
}

// Inserta un usuario nuevo y devuelve sus datos (sin la contraseña)
async function crear({ nombre, correo, contrasenaHash }) {
  const resultado = await pool.query(
    `INSERT INTO usuario (nombre, correo, contrasena_hash, politica_aceptada_en)
     VALUES ($1, $2, $3, NOW())
     RETURNING id, nombre, correo, rol, creado_en`,
    [nombre, correo, contrasenaHash]
  );
  return resultado.rows[0];
}

module.exports = { buscarPorCorreo, crear };
