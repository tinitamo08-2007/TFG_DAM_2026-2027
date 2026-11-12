// src/repositories/sesion.repository.js
// Capa de ACCESO A DATOS: consultas SQL a la tabla sesion (refresh tokens).

const pool = require('../db');

// Guarda una sesión nueva. dias = cuántos días vale el refresh token.
async function crear(usuarioId, tokenHash, dias) {
  await pool.query(
    `INSERT INTO sesion (usuario_id, token_hash, caduca_en)
     VALUES ($1, $2, NOW() + make_interval(days => $3::int))`,
    [usuarioId, tokenHash, dias]
  );
}

// Busca una sesión válida (no revocada y no caducada) y devuelve también los datos del usuario.
async function buscarValida(tokenHash) {
  const resultado = await pool.query(
    `SELECT u.id, u.nombre, u.correo, u.rol
       FROM sesion s
       JOIN usuario u ON u.id = s.usuario_id
      WHERE s.token_hash = $1 AND s.revocado = FALSE AND s.caduca_en > NOW()`,
    [tokenHash]
  );
  return resultado.rows[0];
}

// Cierra la sesión: la marca como revocada
async function revocar(tokenHash) {
  await pool.query('UPDATE sesion SET revocado = TRUE WHERE token_hash = $1', [tokenHash]);
}

module.exports = { crear, buscarValida, revocar };
