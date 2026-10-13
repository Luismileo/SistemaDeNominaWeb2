import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware for CORS allowing credentials (cookies/session) / Middleware de CORS permitiendo credenciales
app.use(
  cors({
    origin: 'http://localhost:5173', // Frontend Vite URL / URL del frontend de Vite
    credentials: true,             // Required for cookies/sessions / Requerido para cookies/sesiones
  })
);

// Middleware to parse JSON bodies / Middleware para parsear cuerpos JSON
app.use(express.json());

// Express-session configuration / Configuración de express-session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'sistema_nomina_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,   // true if using HTTPS / true si se usa HTTPS
      httpOnly: true,  // prevents client-side JS from reading the cookie / previene lectura de cookie por JS del cliente
      maxAge: 1000 * 60 * 60 * 24, // 1 day / 1 día
    },
  })
);

// Routes / Rutas
app.use('/api', authRoutes);

// Root route / Ruta raíz
app.get('/', (req, res) => {
  res.send('Sistema de Nomina API running successfully');
});

// Start server / Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});