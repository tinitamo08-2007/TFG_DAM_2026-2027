# Scripts SQL del proyecto

Orden en el que se ejecutan:

| Archivo | Qué hace | Dónde se ejecuta |
|---|---|---|
| 00_crear_base_datos.sql | Crea la base de datos tienda_local | Conectado a `postgres` |
| 01_tablas_E1.sql | Crea las tablas usuario y token_restablecimiento (E1) | Conectado a `tienda_local` |
| 02_prueba_E1.sql | Inserta datos de prueba y comprueba las restricciones | Conectado a `tienda_local` |
| 03_login_intentos.sql | Añade a usuario las columnas intentos_fallidos y bloqueado_hasta (HU-02, bloqueo tras 5 fallos) | Conectado a `tienda_local` |

Cada vez que se añada una épica, se añade un script nuevo con el siguiente número.
