// src/db.js
// Aquí se crea la conexión con PostgreSQL. Los demás archivos la reutilizan.

// Lee el archivo .env y pone sus datos en process.env (quiet: true evita mensajes extra)
require('dotenv').config({ quiet: true });

const { Pool } = require('pg');

// Un "pool" es un grupo de conexiones que se reutilizan, así no se abre una nueva en cada consulta
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
