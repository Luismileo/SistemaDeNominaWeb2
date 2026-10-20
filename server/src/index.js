import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.js';
import { securityManager } from './security/SecurityManager.js';
import { queryLoader } from './security/QueryLoader.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de CORS que permite credenciales (cookies/sesiones)
app.use(
  cors({
    origin: 'http://localhost:5173', // URL del frontend de Vite
    credentials: true,               // Requerido para cookies/sesiones
  }),
);

// Middleware para parsear cuerpos JSON
app.use(express.json());

// Configuración de express-session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'sistema_nomina_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,   // true si se usa HTTPS
      httpOnly: true,  // previene que el JS del cliente lea la cookie
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    },
  }),
);

// Rutas (autenticación + despachador dinámico /toProcess)
app.use('/api', apiRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Sistema de Nomina API running successfully');
});

// Iniciar servidor
app.listen(PORT, async () => {
  // Precarga de catálogos y verificación de las consultas YAML al arrancar
  try {
    await securityManager.loadCatalogs();
    console.log(`Query loader ready: ${queryLoader.size} SQL statements loaded from YAML`);
    console.log('Security catalogs loaded: subsystems, classes, methods and options');
  } catch (error) {
    console.error('Startup preload error:', error?.message);
  }

  console.log(`Server running on port ${PORT}`);
});
