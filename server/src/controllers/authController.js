import bcrypt from 'bcryptjs';
import { queryLoader } from '../security/QueryLoader.js';
import { securityManager } from '../security/SecurityManager.js';

/**
 * Maneja el inicio de sesión del usuario, valida las credenciales y crea el
 * objeto de sesión.
 * Consulta la tabla "user" relacionada con person y user_profile (nombres en singular).
 */
export const loginUser = async (req, res) => {
  const { username, password } = req.body ?? {};

  try {
    // Validar que se provean el usuario y la contraseña
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Consulta externalizada en queries/securityQueries.yaml (user + person + user_profile)
    const user = await queryLoader.executeOne('getUserWithProfiles', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or user does not exist' });
    }

    // Comparar la contraseña con el hash almacenado
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const profileIds = (user.profile_ids ?? []).map((profileId) => Number(profileId));
    const profileNames = user.profile_names ?? [];
    const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username;

    // Se cargan en memoria los permisos del usuario para el mapa del SecurityManager
    await securityManager.loadPermissions(user.user_id);

    // Crear la estructura de sesión según las notas de clase
    req.session.userId = user.user_id;
    req.session.userName = fullName;
    req.session.profile = profileNames;   // Nombres de perfil (los consume el cliente)
    req.session.profileIds = profileIds;  // IDs de perfil (los usa el despachador /toProcess)

    return res.status(200).json({
      message: 'Login successful',
      user: {
        userId: user.user_id,
        userName: fullName,
        profile: profileNames,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
};

/**
 * Verificar si existe una sesión activa
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
 * Destruir la sesión activa (Cerrar sesión)
 */
export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out, please try again' });
    }
    res.clearCookie('connect.sid'); // Limpiar la cookie de sesión
    return res.status(200).json({ message: 'Logged out successfully' });
  });
};
