/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'

/**
 * Assina o canal Supabase Realtime da tabela `obstacles`.
 * Chama onInsert(row) quando um novo obstáculo é criado.
 * Chama onUpdate(row) quando um obstáculo é atualizado.
 */
export function useRealtimeObstacles({ onInsert, onUpdate } = {}) {
  const channelRef = useRef(null)

  // useEffect(() => {
  //   if (!supabase) return

  //   const channel = supabase
  //     .channel('obstacles-realtime')
  //     .on(
  //       'postgres_changes',
  //       { event: 'INSERT', schema: 'public', table: 'obstacles' },
  //       (payload) => { onInsert?.(payload.new) }
  //     )
  //     .on(
  //       'postgres_changes',
  //       { event: 'UPDATE', schema: 'public', table: 'obstacles' },
  //       (payload) => { onUpdate?.(payload.new) }
  //     )
  //     .subscribe()

  //   channelRef.current = channel

  //   return () => {
  //     supabase.removeChannel(channel)
  //   }
  // }, [])
}
