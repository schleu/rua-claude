import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { obstaclesApi, routesApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useRealtimeObstacles } from '../hooks/useRealtimeObstacles'
import { useNotifications } from '../hooks/useNotifications'
import ObstacleForm from '../components/ObstacleForm'
import RoutePanel from '../components/RoutePanel'
import ToastContainer from '../components/ToastContainer'
import styles from './MapPage.module.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const OBSTACLE_COLORS = {
  hole: '#DC2626', uneven: '#D97706', construction: '#7C3AED',
  pole: '#0891B2', step: '#DB2777', no_ramp: '#EA580C', other: '#6B7280',
}

const OBSTACLE_LABELS = {
  hole: '🕳️ Buraco', uneven: '⚠️ Desnível', construction: '🚧 Obra',
  pole: '🪧 Poste', step: '🪜 Degrau', no_ramp: '🚫 Sem rampa', other: '📍 Outro',
}

function makeObstacleIcon(type, isNew = false) {
  const color = OBSTACLE_COLORS[type] || '#6B7280'
  const pulse = isNew ? `box-shadow:0 0 0 6px ${color}44;` : 'box-shadow:0 2px 6px rgba(0,0,0,.3);'
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;${pulse}display:flex;align-items:center;justify-content:center;font-size:12px;">${OBSTACLE_LABELS[type]?.[0] || '📍'}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  })
}

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,.5);"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
})

function MapClickHandler({ onMapClick, addingObstacle }) {
  useMapEvents({ click(e) { if (addingObstacle) onMapClick(e.latlng) } })
  return null
}

export default function MapPage() {
  const { user } = useAuth()
  const { notifications, notify, dismiss } = useNotifications()
  const [obstacles, setObstacles] = useState([])
  const [newIds, setNewIds] = useState(new Set())
  const [route, setRoute] = useState(null)
  const [userPos, setUserPos] = useState(null)
  const [addingObstacle, setAddingObstacle] = useState(false)
  const [clickedPos, setClickedPos] = useState(null)
  const [showObstacleForm, setShowObstacleForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setUserPos([coords.latitude, coords.longitude]),
      () => setUserPos([-3.7319, -38.5267])
    )
  }, [])

  const loadObstacles = useCallback(async () => {
    try {
      const res = await obstaclesApi.list({ resolved: false })
      setObstacles(res.data?.data || [])
    } catch { setObstacles([]) }
  }, [])

  useEffect(() => { loadObstacles() }, [loadObstacles])

  // Supabase Realtime — novos obstáculos aparecem automaticamente
  useRealtimeObstacles({
    onInsert: (row) => {
      setObstacles(prev => {
        if (prev.find(o => o.id === row.id)) return prev
        return [row, ...prev]
      })
      setNewIds(prev => new Set([...prev, row.id]))
      setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(row.id); return s }), 5000)
      notify({ message: `Novo obstáculo reportado: ${OBSTACLE_LABELS[row.type] || row.type}`, type: 'warning' })
    },
    onUpdate: (row) => {
      setObstacles(prev => row.resolved
        ? prev.filter(o => o.id !== row.id)
        : prev.map(o => o.id === row.id ? row : o)
      )
    },
  })

  const handleMapClick = (latlng) => {
    if (!user) { notify({ message: 'Faça login para reportar obstáculos.', type: 'info' }); return }
    setClickedPos(latlng)
    setShowObstacleForm(true)
  }

  const handleObstacleCreated = () => {
    setShowObstacleForm(false)
    setClickedPos(null)
    setAddingObstacle(false)
    notify({ message: 'Obstáculo reportado com sucesso!', type: 'success' })
    loadObstacles()
  }

  const handleConfirm = async (id) => {
    await obstaclesApi.confirm(id)
    loadObstacles()
    notify({ message: 'Obrigado por confirmar!', type: 'success' })
  }

  const handleResolve = async (id) => {
    await obstaclesApi.resolve(id)
    notify({ message: 'Obstáculo marcado como resolvido.', type: 'success' })
  }

  const filtered = filterType === 'all' ? obstacles : obstacles.filter(o => o.type === filterType)
  const center = userPos || [-3.7319, -38.5267]

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <span className={styles.filterLabel}>Filtrar:</span>
          {['all', ...Object.keys(OBSTACLE_LABELS)].map(t => (
            <button
              key={t}
              className={`${styles.filterBtn} ${filterType === t ? styles.filterActive : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t === 'all' ? 'Todos' : OBSTACLE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <span className={styles.count}>{filtered.length} obstáculo{filtered.length !== 1 ? 's' : ''}</span>
          <button
            className={`${styles.reportBtn} ${addingObstacle ? styles.reportActive : ''}`}
            onClick={() => setAddingObstacle(v => !v)}
          >
            {addingObstacle ? '✕ Cancelar' : '⚠️ Reportar obstáculo'}
          </button>
        </div>
      </div>

      {addingObstacle && (
        <div className={styles.hint}>Clique no mapa onde está o obstáculo</div>
      )}

      <div className={styles.body}>
        <RoutePanel userPos={userPos} onRoute={setRoute} loading={loading} setLoading={setLoading} notify={notify} />

        <div className={`${styles.mapWrap} ${addingObstacle ? styles.crosshair : ''}`}>
          {userPos ? (
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} addingObstacle={addingObstacle} />

              <Marker position={center} icon={userIcon}>
                <Popup>Sua localização atual</Popup>
              </Marker>

              {route?.geometry?.coordinates && (
                <Polyline
                  positions={route.geometry.coordinates.map(([lng, lat]) => [lat, lng])}
                  color="#2563EB" weight={5} opacity={0.85}
                />
              )}

              {filtered.map(obs => (
                <Marker
                  key={obs.id}
                  position={[obs.latitude, obs.longitude]}
                  icon={makeObstacleIcon(obs.type, newIds.has(obs.id))}
                >
                  <Popup>
                    <div className={styles.popup}>
                      <strong>{OBSTACLE_LABELS[obs.type] || 'Obstáculo'}</strong>
                      {obs.description && <p>{obs.description}</p>}
                      {obs.photo_url && (
                        <img src={obs.photo_url} alt="Foto do obstáculo" className={styles.popupPhoto} />
                      )}
                      <div className={styles.popupMeta}>✅ {obs.confirmations} confirmação{obs.confirmations !== 1 ? 'ões' : ''}</div>
                      <div className={styles.popupActions}>
                        <button onClick={() => handleConfirm(obs.id)}>Confirmar</button>
                        {user && <button onClick={() => handleResolve(obs.id)}>Resolvido</button>}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className={styles.mapLoading}>📍 Obtendo localização...</div>
          )}
        </div>
      </div>

      {showObstacleForm && clickedPos && (
        <ObstacleForm
          position={clickedPos}
          onCreated={handleObstacleCreated}
          onCancel={() => { setShowObstacleForm(false); setClickedPos(null) }}
        />
      )}

      <ToastContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  )
}
