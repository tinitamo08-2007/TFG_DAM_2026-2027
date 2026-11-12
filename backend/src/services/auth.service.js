// src/services/auth.service.js
// Capa de SERVICIOS: aquí están las reglas de negocio del registro (HU-01 y HU-06).

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const usuarioRepository = require('../repositories/usuario.repository');
const sesionRepository = require('../repositories/sesion.repository');

// Crea un error con el código HTTP que debe devolver la API
function crearError(status, mensaje, campos) {
  const error = new Error(mensaje);
  error.status = status;
  error.campos = campos;
  return error;
}

// Comprueba los datos que envía el usuario. Devuelve un objeto con un mensaje por cada campo mal.
// Reglas del bloqueo de HU-02
const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

// HU-03: los refresh tokens valen 30 días
const DIAS_REFRESH = 30;

// Hash falso: se usa cuando el correo no existe, para que tarde lo mismo que con un correo real
// y no se pueda adivinar qué correos están registrados mirando el tiempo de respuesta
const HASH_FALSO = bcrypt.hashSync('contrasena-falsa', 10);

function validarRegistro({ nombre, correo, contrasena, aceptaPolitica }) {
  const errores = {};

  if (!nombre || nombre.trim() === '') {
    errores.nombre = 'El nombre es obligatorio';
  }
  // Expresión sencilla: algo + @ + algo + . + algo
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errores.correo = 'Introduce un correo válido';
  }
  if (!contrasena || contrasena.length < 8) {
    errores.contrasena = 'La contraseña debe tener al menos 8 caracteres';
  }
  // HU-06: la política de privacidad debe aceptarse de forma explícita
  if (aceptaPolitica !== true) {
    errores.aceptaPolitica = 'Debes aceptar la política de privacidad';
  }
  return errores;
}

async function registrar(datos) {
  // 1. Validar los datos
  const errores = validarRegistro(datos);
  if (Object.keys(errores).length > 0) {
    throw crearError(400, 'Hay campos con errores', errores);
  }

  const correo = datos.correo.trim().toLowerCase();

  // 2. Comprobar que el correo no esté ya registrado
  if (await usuarioRepository.buscarPorCorreo(correo)) {
    throw crearError(409, 'Este correo ya está registrado');
  }

  // 3. Convertir la contraseña en hash (10 = nivel de dificultad del cifrado)
  const contrasenaHash = await bcrypt.hash(datos.contrasena, 10);

  // 4. Guardar el usuario. El rol será COMPRADOR, porque así lo indica la tabla por defecto
  try {
    return await usuarioRepository.crear({
      nombre: datos.nombre.trim(),
      correo,
      contrasenaHash,
    });
  } catch (error) {
    // 23505 = violación de UNIQUE: dos registros a la vez con el mismo correo
    if (error.code === '23505') {
      throw crearError(409, 'Este correo ya está registrado');
    }
    throw error;
  }
}

// HU-03: crea el token de acceso (JWT) de 15 minutos
function crearToken(usuario) {
  return jwt.sign({ rol: usuario.rol }, process.env.JWT_SECRET, {
    subject: String(usuario.id),
    expiresIn: process.env.JWT_EXPIRES || '15m',
  });
}

// HU-03: el refresh token se guarda como hash SHA-256 (no en claro)
function hashearToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// HU-02: inicio de sesión
async function iniciarSesion({ correo, contrasena }) {
  // 1. Los dos campos son obligatorios
  if (!correo || !contrasena) {
    throw crearError(400, 'Introduce el correo y la contraseña');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta JWT_SECRET en el archivo .env');
  }

  const usuario = await usuarioRepository.buscarParaLogin(correo.trim().toLowerCase());

  // 2. Si el correo no existe, comparamos con el hash falso y damos el mismo mensaje genérico
  if (!usuario) {
    await bcrypt.compare(contrasena, HASH_FALSO);
    throw crearError(401, 'Correo o contraseña incorrectos');
  }

  // 3. Si la cuenta está bloqueada, no se comprueba nada más
  if (usuario.bloqueado) {
    throw crearError(429, 'Demasiados intentos fallidos. Inténtalo de nuevo en ' + usuario.minutos_restantes + ' minuto(s)');
  }
  // Si tuvo un bloqueo que ya terminó, empezamos de cero
  if (usuario.bloqueado_hasta) {
    await usuarioRepository.reiniciarIntentos(usuario.id);
  }

  // 4. Comprobar la contraseña
  const correcta = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!correcta) {
    const fallo = await usuarioRepository.registrarFallo(usuario.id, MAX_INTENTOS, MINUTOS_BLOQUEO);
    if (fallo.bloqueado) {
      throw crearError(429, 'Demasiados intentos fallidos. La cuenta se bloquea ' + MINUTOS_BLOQUEO + ' minutos');
    }
    // Mensaje genérico: no dice si falló el correo o la contraseña
    throw crearError(401, 'Correo o contraseña incorrectos');
  }

  // 5. Acceso correcto: quitamos los fallos y creamos el token (JWT)
  await usuarioRepository.reiniciarIntentos(usuario.id);
  const token = crearToken(usuario);

  // HU-03: refresh token aleatorio. Al usuario se le da el token; en la base de datos solo va su hash
  const refreshToken = crypto.randomBytes(48).toString('hex');
  await sesionRepository.crear(usuario.id, hashearToken(refreshToken), DIAS_REFRESH);

  return {
    token,
    refreshToken,
    usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
  };
}

// HU-03: pide un token de acceso nuevo usando el refresh token (sesión persistente)
async function refrescar({ refreshToken }) {
  if (!refreshToken) {
    throw crearError(400, 'Falta el refresh token');
  }
  const usuario = await sesionRepository.buscarValida(hashearToken(refreshToken));
  if (!usuario) {
    throw crearError(401, 'La sesión no es válida o ha caducado');
  }
  return { token: crearToken(usuario), usuario };
}

// HU-03: cierre de sesión. Revoca el refresh token para que no se pueda volver a usar
async function cerrarSesion({ refreshToken }) {
  if (!refreshToken) {
    throw crearError(400, 'Falta el refresh token');
  }
  await sesionRepository.revocar(hashearToken(refreshToken));
}

module.exports = { registrar, iniciarSesion, refrescar, cerrarSesion };
