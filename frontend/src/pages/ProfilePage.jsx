import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import styles from './ProfilePage.module.css'

const MOBILITY_TYPES = [
  { value: 'wheelchair', label: '♿ Cadeirante' },
  { value: 'cane',       label: '🦯 Bengala' },
  { value: 'walker',     label: '🚶 Andador' },
  { value: 'low_vision', label: '👁️ Visão reduzida' },
  { value: 'full',       label: '✅ Mobilidade plena' },
]

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [mobilityType, setMobilityType] = useState(user?.user_metadata?.mobility_type || 'full')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: fullName, mobility_type: mobilityType } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <h1 className={styles.name}>{fullName || 'Usuário'}</h1>
            <p className={styles.email}>{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          <h2 className={styles.sectionTitle}>Informações pessoais</h2>

          <div className={styles.field}>
            <label className={styles.label}>Nome completo</label>
            <input
              className={styles.input}
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>E-mail</label>
            <input className={styles.input} value={user?.email} disabled />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tipo de mobilidade</label>
            <div className={styles.mobilityGrid}>
              {MOBILITY_TYPES.map(m => (
                <button
                  key={m.value}
                  type="button"
                  className={`${styles.mobilityBtn} ${mobilityType === m.value ? styles.mobilityActive : ''}`}
                  onClick={() => setMobilityType(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saved ? '✅ Salvo!' : saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>

        <div className={styles.dangerZone}>
          <h2 className={styles.sectionTitle}>Conta</h2>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
