import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRealtimeObstacles } from '../hooks/useRealtimeObstacles'
import { useState } from 'react'
import styles from './Layout.module.css'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  // Badge de notificação na navbar quando há novo obstáculo
  useRealtimeObstacles({
    onInsert: () => setUnread(n => n + 1),
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleCommunityClick = () => {
    setUnread(0)
  }

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>♿</span>
          <span className={styles.brandName}>AcessaAqui</span>
        </div>

        <div className={styles.links}>
          <NavLink to="/" end className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
            Mapa
          </NavLink>
          <NavLink to="/places" className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>
            Locais
          </NavLink>
          <NavLink
            to="/community"
            onClick={handleCommunityClick}
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            Comunidade
            {unread > 0 && (
              <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>
            )}
          </NavLink>
        </div>

        <div className={styles.actions}>
          {user ? (
            <>
              <NavLink to="/profile" className={styles.avatarBtn} title={user.user_metadata?.full_name || user.email}>
                {(user.user_metadata?.full_name?.[0] || user.email[0]).toUpperCase()}
              </NavLink>
              <button className={styles.signOutBtn} onClick={handleSignOut}>Sair</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={styles.loginBtn}>Entrar</NavLink>
              <NavLink to="/register" className={styles.registerBtn}>Cadastrar</NavLink>
            </>
          )}
        </div>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
