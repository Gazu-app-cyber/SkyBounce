import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import GamePage from '../pages/GamePage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

function ProtectedGame() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="screen-loader">Carregando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <GamePage />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedGame />} />
      <Route path="/shop" element={<ProtectedGame />} />
      <Route path="/leaderboard" element={<ProtectedGame />} />
      <Route path="/stats" element={<ProtectedGame />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
