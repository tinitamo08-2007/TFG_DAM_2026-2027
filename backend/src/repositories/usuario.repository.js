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

// HU-02: busca al usuario con todo lo necesario para iniciar sesión.
// "bloqueado" dice si ahora mismo está bloqueado, y "minutos_restantes" cuánto falta.
async function buscarParaLogin(correo) {
  const resultado = await pool.query(
    `SELECT id, nombre, correo, rol, contrasena_hash, intentos_fallidos, bloqueado_hasta,
            (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()) AS bloqueado,
            CEIL(EXTRACT(EPOCH FROM (bloqueado_hasta - NOW())) / 60) AS minutos_restantes
     FROM usuario
     WHERE correo = $1`,
    [correo]
  );
  return resultado.rows[0];
}

// HU-02: suma un intento fallido. Si llega al máximo, bloquea la cuenta unos minutos.
async function registrarFallo(id, maxIntentos, minutosBloqueo) {
  const resultado = await pool.query(
    `UPDATE usuario
     SET intentos_fallidos = intentos_fallidos + 1,
         bloqueado_hasta = CASE
           WHEN intentos_fallidos + 1 >= $2::int THEN NOW() + make_interval(mins => $3::int)
           ELSE bloqueado_hasta
         END
     WHERE id = $1
     RETURNING (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()) AS bloqueado`,
    [id, maxIntentos, minutosBloqueo]
  );
  return resultado.rows[0];
}

// HU-02: deja a cero los fallos y quita el bloqueo (tras un acceso correcto o al acabar el bloqueo)
async function reiniciarIntentos(id) {
  await pool.query(
    'UPDATE usuario SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
    [id]
  );
}

// HU-04: cambia la contraseña y quita cualquier bloqueo de la cuenta
async function actualizarContrasena(id, contrasenaHash) {
  await pool.query(
    'UPDATE usuario SET contrasena_hash = $2, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
    [id, contrasenaHash]
  );
}

module.exports = { buscarPorCorreo, crear, buscarParaLogin, registrarFallo, reiniciarIntentos, actualizarContrasena };
