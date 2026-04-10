import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import MapPage from './pages/MapPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PlacesPage from './pages/PlacesPage'
import PlaceDetailPage from './pages/PlaceDetailPage'
import ProfilePage from './pages/ProfilePage'
import CommunityFeedPage from './pages/CommunityFeedPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'var(--gray-400)'}}>Carregando...</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<MapPage />} />
        <Route path="places" element={<PlacesPage />} />
        <Route path="places/:id" element={<PlaceDetailPage />} />
        <Route path="community" element={<CommunityFeedPage />} />
        <Route path="profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      </Route>
    </Routes>
  )
}
