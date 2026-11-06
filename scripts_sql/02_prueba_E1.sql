-- 02_prueba_E1.sql
-- Datos de prueba para comprobar que las tablas de E1 funcionan.
-- El hash es falso: el de verdad lo generará Node más adelante.

INSERT INTO usuario (nombre, correo, contrasena_hash, politica_aceptada_en)
VALUES ('Juan Prueba', 'juan@prueba.com', 'hash_falso_123', NOW());

-- Debe mostrar al usuario recién creado, con rol COMPRADOR
SELECT id, nombre, correo, rol FROM usuario;

-- Esto debe dar ERROR (correo repetido), y eso es lo correcto:
INSERT INTO usuario (nombre, correo, contrasena_hash, politica_aceptada_en)
VALUES ('Otro', 'juan@prueba.com', 'hash_falso_456', NOW());
