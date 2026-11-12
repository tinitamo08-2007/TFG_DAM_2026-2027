// src/repositories/restablecimiento.repository.js
// Capa de ACCESO A DATOS: consultas SQL a la tabla token_restablecimiento (HU-04).

const pool = require('../db');

// Guarda un token nuevo. minutos = cuánto tiempo vale el enlace.
// Antes anula los tokens anteriores sin usar de ese usuario, para que solo valga el último.
async function crear(usuarioId, tokenHash, minutos) {
  await pool.query('UPDATE token_restablecimiento SET usado = TRUE WHERE usuario_id = $1 AND usado = FALSE', [usuarioId]);
  await pool.query(
    `INSERT INTO token_restablecimiento (usuario_id, token_hash, caduca_en)
     VALUES ($1, $2, NOW() + make_interval(mins => $3::int))`,
    [usuarioId, tokenHash, minutos]
  );
}

// Gasta el token: lo marca como usado SOLO si estaba sin usar y sin caducar.
// Devuelve el id del usuario, o undefined si el token no vale.
// Se hace en una sola consulta para que no se pueda usar dos veces a la vez.
async function gastar(tokenHash) {
  const resultado = await pool.query(
    `UPDATE token_restablecimiento SET usado = TRUE
      WHERE token_hash = $1 AND usado = FALSE AND caduca_en > NOW()
      RETURNING usuario_id`,
    [tokenHash]
  );
  return resultado.rows[0] && resultado.rows[0].usuario_id;
}

module.exports = { crear, gastar };
