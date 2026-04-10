import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Obstacles ──────────────────────────────────────────────
export const obstaclesApi = {
  list: (params) => api.get('/api/obstacles/', { params }),
  create: (data) => api.post('/api/obstacles/', data),
  confirm: (id) => api.post(`/api/obstacles/${id}/confirm`),
  resolve: (id) => api.patch(`/api/obstacles/${id}/resolve`),
}

// ── Places ─────────────────────────────────────────────────
export const placesApi = {
  list: (params) => api.get('/api/places/', { params }),
  get: (id) => api.get(`/api/places/${id}`),
  create: (data) => api.post('/api/places/', data),
}

// ── Reviews ────────────────────────────────────────────────
export const reviewsApi = {
  byPlace: (placeId) => api.get(`/api/reviews/place/${placeId}`),
  create: (data) => api.post('/api/reviews/', data),
}

// ── Routes ─────────────────────────────────────────────────
export const routesApi = {
  getRoute: (params) => api.get('/api/routes/', { params }),
  geocode: (q) => api.get('/api/routes/geocode', { params: { q } }),
}

export default api
