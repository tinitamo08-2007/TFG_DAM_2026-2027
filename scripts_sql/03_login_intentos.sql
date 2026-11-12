-- 03_login_intentos.sql
-- HU-02 (inicio de sesión): campos para bloquear la cuenta tras varios intentos fallidos.
-- Se ejecuta conectado a la base de datos tienda_local.

ALTER TABLE usuario
    ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0,  -- cuántos fallos seguidos lleva
    ADD COLUMN bloqueado_hasta TIMESTAMP;                 -- hasta cuándo está bloqueada (vacío = no bloqueada)
