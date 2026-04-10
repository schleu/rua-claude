import { useState, useCallback } from 'react'

let _id = 0

/**
 * Hook simples de notificações toast.
 * Retorna { notifications, notify, dismiss }
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([])

  const notify = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++_id
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, duration)
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return { notifications, notify, dismiss }
}
