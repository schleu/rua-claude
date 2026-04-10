import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './AuthPage.module.css'

const MOBILITY_TYPES = [
  { value: 'wheelchair', label: '♿ Cadeirante' },
  { value: 'cane',       label: '🦯 Bengala' },
  { value: 'walker',     label: '🚶 Andador' },
  { value: 'low_vision', label: '👁️ Visão reduzida' },
  { value: 'full',       label: '✅ Mobilidade plena' },
]

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', mobility_type: 'full',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('Senha deve ter ao menos 6 caracteres.'); return }
    setError('')
    setLoading(true)
    const { error: err } = await signUp(form.email, form.password, {
      full_name: form.full_name,
      mobility_type: form.mobility_type,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <span className={styles.logoIcon}>♿</span>
          <span className={styles.logoName}>AcessaAqui</span>
        </div>

        <h1 className={styles.heading}>Criar conta</h1>
        <p className={styles.sub}>Junte-se à comunidade de acessibilidade urbana</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nome completo</label>
            <input className={styles.input} placeholder="Seu nome" value={form.full_name} onChange={set('full_name')} required autoFocus />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>E-mail</label>
            <input type="email" className={styles.input} placeholder="seu@email.com" value={form.email} onChange={set('email')} required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Senha</label>
            <input type="password" className={styles.input} placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tipo de mobilidade</label>
            <div className={styles.mobilityGrid}>
              {MOBILITY_TYPES.map(m => (
                <button
                  key={m.value}
                  type="button"
                  className={`${styles.mobilityBtn} ${form.mobility_type === m.value ? styles.mobilityActive : ''}`}
                  onClick={() => setForm(f => ({ ...f, mobility_type: m.value }))}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className={styles.footer}>
          Já tem conta?{' '}
          <Link to="/login" className={styles.footerLink}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
