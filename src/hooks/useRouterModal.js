import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const MODAL_ROUTES = {
  shop: '/shop',
  leaderboard: '/leaderboard',
  stats: '/stats',
}

export default function useRouterModal() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentModal = Object.entries(MODAL_ROUTES).find(([, path]) => path === location.pathname)?.[0] ?? null

  const openModal = useCallback((key) => {
    if (MODAL_ROUTES[key]) {
      navigate(MODAL_ROUTES[key])
    }
  }, [navigate])

  const closeModal = useCallback(() => {
    if (location.pathname !== '/') {
      navigate(-1)
    }
  }, [location.pathname, navigate])

  return { currentModal, openModal, closeModal }
}
