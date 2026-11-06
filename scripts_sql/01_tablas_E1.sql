-- 01_tablas_E1.sql
-- Tablas de la épica E1 (cuentas y perfiles).
-- Se ejecuta ya conectado a la base de datos tienda_local.

-- Tabla USUARIO: guarda a todas las personas de la app
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,                       -- número único de cada usuario (Postgres lo suma solo)
    nombre VARCHAR(100) NOT NULL,                -- NOT NULL: es obligatorio
    correo VARCHAR(255) NOT NULL UNIQUE,         -- UNIQUE: no puede haber dos cuentas con el mismo correo (HU-01)
    contrasena_hash VARCHAR(255) NOT NULL,       -- nunca se guarda la contraseña, solo su hash
    rol VARCHAR(20) NOT NULL DEFAULT 'COMPRADOR' -- si no se dice nada, el usuario es comprador
        CHECK (rol IN ('COMPRADOR', 'EMPRENDEDOR', 'ADMIN')),
    foto_url VARCHAR(500),                       -- puede estar vacía
    latitud NUMERIC(9,6) CHECK (latitud BETWEEN -90 AND 90),      -- ubicación por defecto (HU-05)
    longitud NUMERIC(9,6) CHECK (longitud BETWEEN -180 AND 180),
    politica_aceptada_en TIMESTAMP NOT NULL,     -- cuándo aceptó la política de privacidad (HU-06)
    creado_en TIMESTAMP NOT NULL DEFAULT NOW()   -- fecha de creación, automática
);

-- Tabla TOKEN_RESTABLECIMIENTO: enlaces para recuperar la contraseña (HU-04)
CREATE TABLE token_restablecimiento (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL
        REFERENCES usuario(id) ON DELETE CASCADE, -- clave foránea: si se borra el usuario, se borran sus tokens (HU-07)
    token_hash VARCHAR(255) NOT NULL,             -- se guarda el hash, no el token
    caduca_en TIMESTAMP NOT NULL,                 -- el enlace caduca
    usado BOOLEAN NOT NULL DEFAULT FALSE          -- un enlace ya usado no sirve otra vez
);
