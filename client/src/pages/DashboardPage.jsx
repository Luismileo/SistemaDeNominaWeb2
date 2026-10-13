import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Dashboard Page Component (Main protected view).
 * Componente de la página del Panel Principal (Vista protegida principal).
 */
export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.brand}>Sistema de Nómina</h1>
          <div style={styles.userInfo}>
            <span style={styles.welcomeText}>Hola, <strong>{user?.userName}</strong></span>
            <button onClick={handleLogoutClick} style={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.welcomeCard}>
          <h2>Panel de Control Principal</h2>
          <p style={styles.leadText}>
            Bienvenido al sistema automatizado de gestión de nómina y personal.
          </p>

          <div style={styles.infoGrid}>
            <div style={styles.infoBox}>
              <h3>ID de Usuario</h3>
              <p style={styles.infoValue}>{user?.userId}</p>
            </div>
            <div style={styles.infoBox}>
              <h3>Perfiles / Roles Asignados</h3>
              <p style={styles.infoValue}>
                {user?.profile && user.profile.length > 0 ? user.profile.join(', ') : 'Sin perfiles'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Inline styles for professional layout / Estilos en línea para diseño profesional
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e5e5',
    padding: '15px 30px',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  brand: {
    margin: '0',
    fontSize: '20px',
    color: '#0066cc',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  welcomeText: {
    fontSize: '15px',
    color: '#333333',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  leadText: {
    color: '#666666',
    marginBottom: '30px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
  },
  infoValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0066cc',
    marginTop: '8px',
  },
};