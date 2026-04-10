import { useState, useEffect, useCallback } from 'react'
import { obstaclesApi, reviewsApi } from '../services/api'
import { useRealtimeObstacles } from '../hooks/useRealtimeObstacles'
import { useNotifications } from '../hooks/useNotifications'
import ToastContainer from '../components/ToastContainer'
import styles from './CommunityFeedPage.module.css'

const OBSTACLE_LABELS = {
  hole: '🕳️ Buraco', uneven: '⚠️ Desnível', construction: '🚧 Obra',
  pole: '🪧 Poste', step: '🪜 Degrau', no_ramp: '🚫 Sem rampa', other: '📍 Outro',
}

const TYPE_COLORS = {
  hole: '#DC2626', uneven: '#D97706', construction: '#7C3AED',
  pole: '#0891B2', step: '#DB2777', no_ramp: '#EA580C', other: '#6B7280',
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

function ObstacleCard({ obs, onConfirm, onResolve, isNew }) {
  const color = TYPE_COLORS[obs.type] || '#6B7280'
  return (
    <div className={`${styles.card} ${isNew ? styles.cardNew : ''}`}>
      <div className={styles.cardLeft}>
        <div className={styles.typeDot} style={{ background: color }} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.typeLabel} style={{ color }}>{OBSTACLE_LABELS[obs.type]}</span>
          {isNew && <span className={styles.newBadge}>Novo</span>}
          <span className={styles.time}>{timeAgo(obs.created_at)}</span>
        </div>
        {obs.description && <p className={styles.desc}>{obs.description}</p>}
        {obs.photo_url && (
          <img src={obs.photo_url} alt="Obstáculo" className={styles.photo} />
        )}
        <div className={styles.cardMeta}>
          <span className={styles.coords}>
            📍 {Number(obs.latitude).toFixed(4)}, {Number(obs.longitude).toFixed(4)}
          </span>
          <span className={styles.confirms}>✅ {obs.confirmations} confirmação{obs.confirmations !== 1 ? 'ões' : ''}</span>
        </div>
        <div className={styles.cardActions}>
          <button className={styles.confirmBtn} onClick={() => onConfirm(obs.id)}>
            Confirmar obstáculo
          </button>
          <button className={styles.resolvedBtn} onClick={() => onResolve(obs.id)}>
            Marcar resolvido
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommunityFeedPage() {
  const { notifications, notify, dismiss } = useNotifications()
  const [obstacles, setObstacles] = useState([])
  const [newIds, setNewIds] = useState(new Set())
  const [tab, setTab] = useState('obstacles')
  const [loading, setLoading] = useState(true)

  const loadObstacles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await obstaclesApi.list({ resolved: false })
      const sorted = (res.data?.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setObstacles(sorted)
    } catch { setObstacles([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadObstacles() }, [loadObstacles])

  useRealtimeObstacles({
    onInsert: (row) => {
      setObstacles(prev => [row, ...prev])
      setNewIds(prev => new Set([...prev, row.id]))
      setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(row.id); return s }), 8000)
      notify({ message: `Novo reporte: ${OBSTACLE_LABELS[row.type] || row.type}`, type: 'warning' })
    },
    onUpdate: (row) => {
      setObstacles(prev =>
        row.resolved ? prev.filter(o => o.id !== row.id) : prev.map(o => o.id === row.id ? row : o)
      )
    },
  })

  const handleConfirm = async (id) => {
    await obstaclesApi.confirm(id)
    setObstacles(prev => prev.map(o => o.id === id ? { ...o, confirmations: (o.confirmations || 0) + 1 } : o))
    notify({ message: 'Obrigado por confirmar!', type: 'success' })
  }

  const handleResolve = async (id) => {
    await obstaclesApi.resolve(id)
    setObstacles(prev => prev.filter(o => o.id !== id))
    notify({ message: 'Obstáculo marcado como resolvido.', type: 'success' })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Comunidade</h1>
          <p className={styles.subtitle}>Reportes e atualizações em tempo real</p>
        </div>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          Ao vivo
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'obstacles' ? styles.tabActive : ''}`}
          onClick={() => setTab('obstacles')}
        >
          ⚠️ Obstáculos ({obstacles.length})
        </button>
      </div>

      <div className={styles.feed}>
        {loading && (
          <div className={styles.empty}>Carregando feed...</div>
        )}

        {!loading && obstacles.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🌟</span>
            <p>Nenhum obstáculo ativo na área.</p>
            <p className={styles.emptySub}>Quando alguém reportar, aparecerá aqui em tempo real.</p>
          </div>
        )}

        {!loading && obstacles.map(obs => (
          <ObstacleCard
            key={obs.id}
            obs={obs}
            isNew={newIds.has(obs.id)}
            onConfirm={handleConfirm}
            onResolve={handleResolve}
          />
        ))}
      </div>

      <ToastContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}
