import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { placesApi, reviewsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { uploadPhoto } from '../services/storage'
import PhotoUpload from '../components/PhotoUpload'
import styles from './PlaceDetailPage.module.css'

const CRITERIA = [
  { key: 'rating_ramp',          label: '🔼 Rampa de acesso' },
  { key: 'rating_bathroom',      label: '🚻 Banheiro acessível' },
  { key: 'rating_parking',       label: '🅿️ Vaga PCD' },
  { key: 'rating_tactile_floor', label: '👣 Piso tátil' },
]

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className={styles.starInput}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={styles.starBtn}
          style={{ color: n <= (hover || value) ? '#F59E0B' : '#D1D5DB' }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >★</button>
      ))}
    </div>
  )
}

function RatingBar({ label, value }) {
  return (
    <div className={styles.ratingRow}>
      <span className={styles.ratingLabel}>{label}</span>
      <div className={styles.ratingBar}>
        <div className={styles.ratingFill} style={{ width: `${((value || 0) / 5) * 100}%` }} />
      </div>
      <span className={styles.ratingVal}>{value ? value.toFixed(1) : '—'}</span>
    </div>
  )
}

export default function PlaceDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [place, setPlace]     = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [form, setForm] = useState({
    rating_ramp: 3, rating_bathroom: 3, rating_parking: 3, rating_tactile_floor: 3, comment: '',
  })
  const [submitting, setSubmitting]   = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [error, setError]             = useState('')

  const loadData = async () => {
    try {
      const [placeRes, reviewsRes] = await Promise.all([
        placesApi.get(id),
        reviewsApi.byPlace(id),
      ])
      setPlace(placeRes.data)
      setReviews(reviewsRes.data?.data || [])
    } catch {
      navigate('/places')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setSubmitting(true)
    setError('')

    try {
      let photo_url = null
      if (photoFile) {
        setSubmitStatus('Enviando foto...')
        photo_url = await uploadPhoto(photoFile, 'reviews')
        if (!photo_url) throw new Error('Falha no upload da foto.')
      }
      setSubmitStatus('Salvando avaliação...')
      await reviewsApi.create({ place_id: id, ...form, photo_url })
      setShowForm(false)
      setPhotoFile(null)
      setForm({ rating_ramp: 3, rating_bathroom: 3, rating_parking: 3, rating_tactile_floor: 3, comment: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erro ao enviar avaliação.')
    } finally {
      setSubmitting(false)
      setSubmitStatus('')
    }
  }

  const avgByCriteria = (key) => {
    const vals = reviews.filter(r => r[key]).map(r => r[key])
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  if (loading) return <div className={styles.loading}>Carregando...</div>
  if (!place) return null

  const hasRatings = reviews.length > 0
  const overallAvg = hasRatings
    ? CRITERIA.reduce((sum, c) => sum + (avgByCriteria(c.key) || 0), 0) / CRITERIA.length
    : null

  const accessLabel = overallAvg >= 4 ? { text: '✅ Acessível', cls: styles.tagGreen }
    : overallAvg >= 2.5              ? { text: '⚠️ Parcialmente acessível', cls: styles.tagAmber }
    : overallAvg                     ? { text: '🚫 Inacessível', cls: styles.tagRed }
    : null

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/places')}>← Voltar</button>
          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{place.name}</h1>
              {accessLabel && <span className={`${styles.accessTag} ${accessLabel.cls}`}>{accessLabel.text}</span>}
            </div>
            {place.address && <p className={styles.address}>📍 {place.address}</p>}
          </div>
          {user && (
            <button className={styles.reviewBtn} onClick={() => setShowForm(v => !v)}>
              {showForm ? 'Cancelar' : '⭐ Avaliar'}
            </button>
          )}
        </div>

        {/* Rating summary */}
        <div className={styles.summary}>
          <div className={styles.overallScore}>
            <span className={styles.scoreNum}>{overallAvg ? overallAvg.toFixed(1) : '—'}</span>
            <span className={styles.scoreLabel}>nota geral</span>
            <span className={styles.scoreCount}>{reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''}</span>
          </div>
          <div className={styles.criteria}>
            {CRITERIA.map(c => (
              <RatingBar key={c.key} label={c.label} value={avgByCriteria(c.key)} />
            ))}
          </div>
        </div>

        {/* Review form */}
        {showForm && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h3 className={styles.formTitle}>Sua avaliação</h3>
            {CRITERIA.map(c => (
              <div key={c.key} className={styles.formRow}>
                <span className={styles.formLabel}>{c.label}</span>
                <StarInput value={form[c.key]} onChange={v => setForm(f => ({ ...f, [c.key]: v }))} />
              </div>
            ))}
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Comentário (opcional)</label>
              <textarea
                className={styles.textarea}
                placeholder="Descreva a acessibilidade do local..."
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                rows={3}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Foto (opcional)</label>
              <PhotoUpload onFile={setPhotoFile} label="Adicionar foto do local" />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? (submitStatus || 'Enviando...') : 'Enviar avaliação'}
            </button>
          </form>
        )}

        {/* Reviews list */}
        <div className={styles.reviewsList}>
          <h3 className={styles.reviewsTitle}>Avaliações ({reviews.length})</h3>
          {reviews.length === 0 && (
            <div className={styles.noReviews}>
              <span>⭐</span>
              <p>Nenhuma avaliação ainda.</p>
              {user
                ? <p className={styles.noReviewsSub}>Clique em "Avaliar" para ser o primeiro!</p>
                : <p className={styles.noReviewsSub}>Faça login para avaliar este local.</p>
              }
            </div>
          )}
          {reviews.map(r => (
            <div key={r.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewAvatar}>U</div>
                <div className={styles.reviewMeta}>
                  <div className={styles.reviewStars}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} style={{ color: n <= Math.round(r.avg_rating) ? '#F59E0B' : '#D1D5DB' }}>★</span>
                    ))}
                    <span className={styles.reviewAvg}>{Number(r.avg_rating).toFixed(1)}</span>
                  </div>
                  <span className={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <div className={styles.reviewCriteria}>
                {CRITERIA.map(c => r[c.key] && (
                  <span key={c.key} className={styles.criteriaChip}>
                    {c.label.split(' ').slice(1).join(' ')}: {r[c.key]}/5
                  </span>
                ))}
              </div>
              {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
              {r.photo_url && (
                <img src={r.photo_url} alt="Foto da avaliação" className={styles.reviewPhoto} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
