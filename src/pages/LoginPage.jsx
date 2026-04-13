import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const [displayName, setDisplayName] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleSubmit(event) {
    event.preventDefault()
    if (!displayName.trim()) {
      return
    }

    signIn(displayName)
    navigate(location.state?.from ?? '/', { replace: true })
  }

  return (
    <AppShell>
      <main className="screen-center">
        <form className="panel login-panel" onSubmit={handleSubmit}>
          <div className="panel-header centered">
            <div className="hero-emoji">🚀</div>
            <h1>Sky Bounce</h1>
            <p className="subtle-text">Entre com um nome para jogar e aparecer no ranking.</p>
          </div>
          <label className="field">
            <span>Nome do jogador</span>
            <input value={displayName} maxLength={18} onChange={(event) => setDisplayName(event.target.value)} placeholder="Seu nome" />
          </label>
          <button className="button button-primary" type="submit">Entrar</button>
        </form>
      </main>
    </AppShell>
  )
}
