import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * Handle user login, validate credentials, and create the session object.
 * Maneja el inicio de sesión del usuario, valida credenciales y crea el objeto de sesión.
 */
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate that username and password are provided / Validar que se provean credenciales
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query to find user and aggregate their profiles / Consulta para buscar usuario y sus perfiles
    const query = `
      SELECT 
          u.user_id, 
          u.user_name, 
          u.username,
          u.password_hash,
          COALESCE(array_agg(p.profile_name) FILTER (WHERE p.profile_name IS NOT NULL), '{}') AS profiles
      FROM users u
      LEFT JOIN user_profiles up ON u.user_id = up.user_id
      LEFT JOIN profiles p ON up.profile_id = p.profile_id
      WHERE u.username = $1
      GROUP BY u.user_id, u.user_name, u.username, u.password_hash;
    `;

    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or user does not exist' });
    }

    const user = result.rows[0];

    // Compare password with stored hash / Comparar contraseña con el hash almacenado
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session structure as requested in class notes / Crear estructura de sesión según notas de clase
    req.session.userId = user.user_id;
    req.session.userName = user.user_name;
    req.session.profile = user.profiles;

    return res.status(200).json({
      message: 'Login successful',
      user: {
        userId: user.user_id,
        userName: user.user_name,
        profile: user.profiles,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
};

/**
 * Check if active session exists / Verificar si existe sesión activa
 */
export const checkSession = (req, res) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({
      authenticated: true,
      session: {
        userId: req.session.userId,
        userName: req.session.userName,
        profile: req.session.profile,
      },
    });
  }
  return res.status(401).json({ authenticated: false, error: 'No active session' });
};

/**
 * Destroy active session (Logout) / Destruir sesión activa (Cerrar sesión)
 */
export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out, please try again' });
    }
    res.clearCookie('connect.sid'); // Clear session cookie / Limpiar cookie de sesión
    return res.status(200).json({ message: 'Logged out successfully' });
  });
};