import { useState, useCallback, useRef } from 'react'
import { routesApi } from '../services/api'
import styles from './RoutePanel.module.css'

export default function RoutePanel({ userPos, onRoute, loading, setLoading }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [destination, setDestination] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const debounceRef = useRef(null)

  const handleQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 3) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await routesApi.geocode(val)
        setSuggestions(res.data || [])
      } catch { setSuggestions([]) }
    }, 400)
  }

  const handleSelect = (place) => {
    setDestination(place)
    setQuery(place.display_name.split(',').slice(0, 2).join(','))
    setSuggestions([])
  }

  const handleRoute = async () => {
    if (!userPos || !destination) return
    setLoading(true)
    try {
      const res = await routesApi.getRoute({
        origin_lat: userPos[0], origin_lng: userPos[1],
        dest_lat: destination.lat, dest_lng: destination.lng,
      })
      onRoute(res.data)
      const dist = (res.data.distance_m / 1000).toFixed(1)
      const mins = Math.round(res.data.duration_s / 60)
      setRouteInfo({ dist, mins })
    } catch {
      alert('Não foi possível calcular a rota.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setDestination(null)
    setSuggestions([])
    setRouteInfo(null)
    onRoute(null)
  }

  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>🛣️ Planejar rota</p>

      <div className={styles.searchWrap}>
        <input
          className={styles.input}
          placeholder="Para onde você quer ir?"
          value={query}
          onChange={handleQueryChange}
        />
        {suggestions.length > 0 && (
          <ul className={styles.suggestions}>
            {suggestions.map((s, i) => (
              <li key={i} onClick={() => handleSelect(s)} className={styles.suggestion}>
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.routeBtn}
          onClick={handleRoute}
          disabled={!destination || loading}
        >
          {loading ? 'Calculando...' : 'Traçar rota'}
        </button>
        {routeInfo && (
          <button className={styles.clearBtn} onClick={handleClear}>Limpar</button>
        )}
      </div>

      {routeInfo && (
        <div className={styles.routeInfo}>
          <div className={styles.routeStat}>
            <span className={styles.statVal}>{routeInfo.dist} km</span>
            <span className={styles.statLabel}>distância</span>
          </div>
          <div className={styles.routeDivider} />
          <div className={styles.routeStat}>
            <span className={styles.statVal}>{routeInfo.mins} min</span>
            <span className={styles.statLabel}>a pé</span>
          </div>
        </div>
      )}
    </div>
  )
}
