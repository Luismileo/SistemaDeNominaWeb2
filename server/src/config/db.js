import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Crear un pool de conexión usando la cadena de conexión de Neon desde las variables de entorno
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Requerido para las bases de datos en la nube de Neon
  },
});

// Probar la conexión a la base de datos
pool.on('connect', () => {
  console.log('Database connected successfully to Neon PostgreSQL');
});
