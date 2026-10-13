import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/**
 * Component to protect routes requiring authentication.
 * Componente para proteger rutas que requieren autenticación.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontSize: '0.95rem',
          color: '#94a3b8',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid rgba(245, 158, 11, 0.2)',
            borderTopColor: '#f59e0b',
            animation: 'spin 700ms linear infinite',
          }}
        />
        Verificando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}