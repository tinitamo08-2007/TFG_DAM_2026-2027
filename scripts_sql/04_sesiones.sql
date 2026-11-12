-- 04_sesiones.sql
-- HU-03 (sesión persistente y cierre de sesión): tabla donde se guardan los refresh tokens.
-- Se ejecuta conectado a la base de datos tienda_local.
-- Del refresh token solo se guarda su hash (SHA-256), igual que con las contraseñas:
-- si alguien viera la base de datos, no podría usar los tokens.

CREATE TABLE sesion (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,      -- hash SHA-256 del refresh token
    caduca_en   TIMESTAMP NOT NULL,               -- cuándo deja de valer
    revocado    BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE = se cerró la sesión
    creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);
