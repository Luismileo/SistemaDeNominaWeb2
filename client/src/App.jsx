import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { api } from './services/api';

/**
 * Main App Component managing authentication state.
 * Componente principal de la App que maneja el estado de autenticación.
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check active session on initial load / Verificar sesión activa en la carga inicial
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get('/session');
        if (response.data.authenticated) {
          setUser(response.data.session);
        }
      } catch (err) {
        console.log('No active session found');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Handle user logout / Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await api.post('/logout');
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando aplicación...</div>;
  }

  return (
    <div>
      {!user ? (
        <LoginForm onLoginSuccess={(userData) => setUser(userData)} />
      ) : (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1>¡Bienvenido, {user.userName}!</h1>
          <p>ID de Usuario: {user.userId}</p>
          <p>Perfil asignado: {user.profile?.join(', ')}</p>
          <button 
            onClick={handleLogout} 
            style={{ padding: '10px 20px', background: '#dc3545', color: '#white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}