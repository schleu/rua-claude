import styles from './ToastContainer.module.css'

const ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }

export default function ToastContainer({ notifications, onDismiss }) {
  if (!notifications.length) return null

  return (
    <div className={styles.container}>
      {notifications.map(n => (
        <div key={n.id} className={`${styles.toast} ${styles[n.type] || styles.info}`}>
          <span className={styles.icon}>{ICONS[n.type] || ICONS.info}</span>
          <span className={styles.message}>{n.message}</span>
          <button className={styles.close} onClick={() => onDismiss(n.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}
