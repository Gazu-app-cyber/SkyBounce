import { Link } from 'react-router-dom'
import AppShell from '../components/layout/AppShell.jsx'

export default function NotFoundPage() {
  return (
    <AppShell>
      <main className="screen-center">
        <div className="panel login-panel">
          <div className="panel-header centered">
            <h1>Pagina nao encontrada</h1>
            <p className="subtle-text">A rota que voce tentou abrir nao existe.</p>
          </div>
          <Link className="button button-primary" to="/">Voltar ao jogo</Link>
        </div>
      </main>
    </AppShell>
  )
}
