import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearSession, loadSession, saveSession } from '../lib/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSession(loadSession())
    setLoading(false)
  }, [])

  function signIn(displayName) {
    const nextSession = {
      playerId: crypto.randomUUID(),
      displayName: displayName.trim(),
      createdAt: Date.now(),
    }
    saveSession(nextSession)
    setSession(nextSession)
    return nextSession
  }

  function signOut() {
    clearSession()
    setSession(null)
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      isAuthenticated: Boolean(session),
      signIn,
      signOut,
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return value
}
