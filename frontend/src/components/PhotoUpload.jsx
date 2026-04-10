import { useState, useRef } from 'react'
import { fileToPreview } from '../services/storage'
import styles from './PhotoUpload.module.css'

/**
 * Componente de upload de foto com preview.
 * Chama onFile(file) quando o usuário seleciona uma imagem.
 */
export default function PhotoUpload({ onFile, preview, label = 'Adicionar foto' }) {
  const inputRef = useRef(null)
  const [localPreview, setLocalPreview] = useState(preview || null)

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Foto deve ter no máximo 5MB.')
      return
    }
    const prev = await fileToPreview(file)
    setLocalPreview(prev)
    onFile(file)
  }

  const handleRemove = () => {
    setLocalPreview(null)
    onFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={styles.wrap}>
      {localPreview ? (
        <div className={styles.preview}>
          <img src={localPreview} alt="Preview" className={styles.img} />
          <button type="button" className={styles.remove} onClick={handleRemove}>✕</button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.trigger}
          onClick={() => inputRef.current?.click()}
        >
          <span className={styles.icon}>📷</span>
          <span>{label}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className={styles.hidden}
      />
    </div>
  )
}
