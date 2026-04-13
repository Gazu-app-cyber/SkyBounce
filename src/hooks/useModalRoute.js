import { useEffect, useState } from 'react'

const VALID = new Set(['shop', 'leaderboard', 'stats', 'customize'])

function readModalFromPath() {
  const path = window.location.pathname.replace(/^\/+/, '')
  return VALID.has(path) ? path : null
}

export function useModalRoute() {
  const [modal, setModal] = useState(readModalFromPath)

  useEffect(() => {
    function onPopState() {
      setModal(readModalFromPath())
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function openModal(name) {
    if (!VALID.has(name)) {
      return
    }

    window.history.pushState({ modal: name }, '', `/${name}`)
    setModal(name)
  }

  function closeModal() {
    if (!readModalFromPath()) {
      setModal(null)
      return
    }

    window.history.back()
  }

  return { modal, openModal, closeModal }
}
