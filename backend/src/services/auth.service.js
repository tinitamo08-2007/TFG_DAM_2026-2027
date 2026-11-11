// src/services/auth.service.js
// Capa de SERVICIOS: aquí están las reglas de negocio del registro (HU-01 y HU-06).

const bcrypt = require('bcryptjs');
const usuarioRepository = require('../repositories/usuario.repository');

// Crea un error con el código HTTP que debe devolver la API
function crearError(status, mensaje, campos) {
  const error = new Error(mensaje);
  error.status = status;
  error.campos = campos;
  return error;
}

// Comprueba los datos que envía el usuario. Devuelve un objeto con un mensaje por cada campo mal.
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

module.exports = { registrar };
