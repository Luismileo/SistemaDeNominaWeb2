import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import styles from './DashboardPage.module.css';

/**
 * Derive up to two initials from the user name for the avatar.
 * Deriva hasta dos iniciales del nombre de usuario para el avatar.
 */
const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'US';

/**
 * Dashboard Page Component (Main protected view).
 * Componente de la página del Panel Principal (Vista protegida principal).
 */
export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const profiles = user?.profile ?? [];
  const primaryRole = profiles.length > 0 ? profiles[0] : 'Usuario';

  const handleLogoutClick = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
                <path d="M6 15h4" />
              </svg>
            </span>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Sistema de Nómina</span>
              <span className={styles.brandSubtitle}>Panel de gestión</span>
            </div>
          </div>

          <div className={styles.userArea}>
            <div className={styles.userChip}>
              <span className={styles.avatar} aria-hidden="true">
                {getInitials(user?.userName)}
              </span>
              <div className={styles.userMeta}>
                <span className={styles.userName}>{user?.userName}</span>
                <span className={styles.userRole}>{primaryRole}</span>
              </div>
            </div>

            <button onClick={handleLogoutClick} className={styles.logoutButton}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.welcomeCard}>
          <div className={styles.welcomeContent}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              Sesión activa
            </span>

            <h2 className={styles.heading}>Panel de Control Principal</h2>
            <p className={styles.lead}>
              Bienvenido al sistema automatizado de gestión de nómina y personal.
            </p>

            <div className={styles.kpiGrid}>
              <article className={styles.kpi}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span className={styles.kpiLabel}>ID de Usuario</span>
                </div>
                <span className={styles.kpiValue}>{user?.userId}</span>
              </article>

              <article className={styles.kpi}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>
                  <span className={styles.kpiLabel}>Perfiles / Roles Asignados</span>
                </div>
                {profiles.length > 0 ? (
                  <div className={styles.badgeList}>
                    {profiles.map((profile) => (
                      <span key={profile} className={styles.badge}>
                        <span className={styles.badgeDot} aria-hidden="true" />
                        {profile}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.badgeList}>
                    <span className={styles.emptyBadge}>Sin perfiles</span>
                  </div>
                )}
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
