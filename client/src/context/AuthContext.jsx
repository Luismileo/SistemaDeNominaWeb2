import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuthContext } from './useAuth';

/**
 * Authentication Provider component to wrap the application and share user session state.
 * Componente proveedor de autenticación para envolver la aplicación y compartir el estado de sesión del usuario.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check active session on initial app load / Verificar sesión activa al cargar la aplicación inicialmente
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await api.get('/session');
        if (response.data.authenticated) {
          setUser(response.data.session);
        }
      } catch {
        console.log('No active session found / No se encontró sesión activa');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  /**
   * Login function to authenticate user / Función de inicio de sesión para autenticar al usuario
   */
  const login = async (username, password) => {
    const response = await api.post('/login', { username, password });
    setUser(response.data.user);
    return response.data;
  };

  /**
   * Logout function to destroy session / Función para cerrar sesión y destruir la sesión
   */
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Error during logout / Error al cerrar sesión', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}