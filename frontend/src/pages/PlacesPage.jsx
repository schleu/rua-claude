import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { placesApi } from '../services/api'
import styles from './PlacesPage.module.css'

const CATEGORIES = [
  { value: 'all',       label: 'Todos' },
  { value: 'commerce',  label: '🛒 Comércio' },
  { value: 'health',    label: '🏥 Saúde' },
  { value: 'education', label: '🏫 Educação' },
  { value: 'transport', label: '🚌 Transporte' },
  { value: 'other',     label: '📍 Outros' },
]

function StarRating({ value }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= Math.round(value) ? '#F59E0B' : '#D1D5DB' }}>★</span>
      ))}
      <span className={styles.ratingNum}>{value ? value.toFixed(1) : '—'}</span>
    </span>
  )
}

function AccessBadge({ rating }) {
  if (!rating) return <span className={`${styles.badge} ${styles.badgeGray}`}>Sem avaliação</span>
  if (rating >= 4) return <span className={`${styles.badge} ${styles.badgeGreen}`}>✅ Acessível</span>
  if (rating >= 2.5) return <span className={`${styles.badge} ${styles.badgeAmber}`}>⚠️ Parcial</span>
  return <span className={`${styles.badge} ${styles.badgeRed}`}>🚫 Inacessível</span>
}

export default function PlacesPage() {
  const [places, setPlaces] = useState([])
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    placesApi.list(category !== 'all' ? { category } : {})
      .then(res => setPlaces(res.data?.data || []))
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false))
  }, [category])

  const filtered = places.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.address || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Locais avaliados</h2>
          <p className={styles.sidebarSub}>Veja a acessibilidade de comércios e serviços</p>
        </div>

        <input
          className={styles.search}
          placeholder="🔍  Buscar local..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className={styles.catList}>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              className={`${styles.catBtn} ${category === c.value ? styles.catActive : ''}`}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list}>
        {loading && (
          <div className={styles.empty}>Carregando locais...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🗺️</span>
            <p>Nenhum local encontrado.</p>
            <p className={styles.emptySub}>Configure o Supabase para adicionar locais.</p>
          </div>
        )}

        {!loading && filtered.map(place => (
          <Link key={place.id} to={`/places/${place.id}`} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardName}>{place.name}</h3>
                {place.address && <p className={styles.cardAddr}>{place.address}</p>}
              </div>
              <AccessBadge rating={place.avg_rating} />
            </div>

            <div className={styles.cardFooter}>
              <StarRating value={place.avg_rating} />
              <span className={styles.reviewCount}>
                {place.review_count || 0} avaliação{place.review_count !== 1 ? 'ões' : ''}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
