import React, { useState } from 'react';
import { api } from '../services/api';

/**
 * Login Form Component.
 * Componente de formulario de inicio de sesión.
 */
export function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Send credentials to backend / Enviar credenciales al backend
      const response = await api.post('/login', { username, password });
      onLoginSuccess(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Error during login');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Login - Sistema de Nómina</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: '#white', border: 'none', borderRadius: '4px' }}>
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}