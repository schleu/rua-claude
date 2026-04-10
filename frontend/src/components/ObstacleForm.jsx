import { useState } from 'react'
import { obstaclesApi } from '../services/api'
import { uploadPhoto } from '../services/storage'
import PhotoUpload from './PhotoUpload'
import styles from './ObstacleForm.module.css'

const TYPES = [
  { value: 'hole',         label: '🕳️ Buraco' },
  { value: 'uneven',       label: '⚠️ Desnível' },
  { value: 'construction', label: '🚧 Obra' },
  { value: 'pole',         label: '🪧 Poste / Obstáculo' },
  { value: 'step',         label: '🪜 Degrau' },
  { value: 'no_ramp',      label: '🚫 Sem rampa' },
  { value: 'other',        label: '📍 Outro' },
]

export default function ObstacleForm({ position, onCreated, onCancel }) {
  const [type, setType] = useState('hole')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let photo_url = null

      if (photoFile) {
        setUploadProgress('Enviando foto...')
        photo_url = await uploadPhoto(photoFile, 'obstacles')
        if (!photo_url) throw new Error('Falha no upload da foto.')
      }

      setUploadProgress('Salvando...')
      await obstaclesApi.create({
        latitude: position.lat,
        longitude: position.lng,
        type,
        description: description.trim() || null,
        photo_url,
      })
      onCreated()
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erro ao reportar obstáculo.')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Reportar obstáculo</h3>
          <button className={styles.closeBtn} onClick={onCancel}>✕</button>
        </div>

        <div className={styles.coords}>
          📍 {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>Tipo de obstáculo</label>
          <div className={styles.typeGrid}>
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`${styles.typeBtn} ${type === t.value ? styles.typeActive : ''}`}
                onClick={() => setType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className={styles.label}>Descrição (opcional)</label>
          <textarea
            className={styles.textarea}
            placeholder="Descreva o obstáculo para ajudar outros usuários..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
          />

          <label className={styles.label}>Foto (opcional)</label>
          <PhotoUpload onFile={setPhotoFile} label="Tirar ou escolher foto" />

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (uploadProgress || 'Aguarde...') : '⚠️ Reportar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
