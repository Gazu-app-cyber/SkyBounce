import { useEffect, useRef, useState } from 'react'
import { getLeaderboard } from '../../api/gameApi'

export default function LeaderboardModal({ open, onClose, playerId, playerName }) {
  const [tab, setTab] = useState('global')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState({ entries: [], playerRank: null })
  const scrollRef = useRef(null)
  const pullStartRef = useRef(null)
  const [pullAmount, setPullAmount] = useState(0)

  async function load(scope, refresh = false) {
    if (refresh) setRefreshing(true)
    else setLoading(true)

    try {
      const next = await getLeaderboard(scope, playerId)
      setData(next)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (open) load(tab)
  }, [open, tab, playerId])

  if (!open) return null

  return (
    <div className="modal-overlay">
      <div className="panel modal-panel">
        <div className="panel-header">
          <div>
            <h2>Ranking</h2>
            <p className="subtle-text">Posicao atual: {data.playerRank ? `#${data.playerRank}` : 'sem colocacao'}</p>
          </div>
          <button className="close-button" onClick={onClose}>Fechar</button>
        </div>

        <div className="tabs-row">
          <button className={`tab-button ${tab === 'global' ? 'active' : ''}`} onClick={() => setTab('global')}>Global</button>
          <button className={`tab-button ${tab === 'weekly' ? 'active' : ''}`} onClick={() => setTab('weekly')}>Semanal</button>
        </div>

        <div
          className="leaderboard-scroll"
          ref={scrollRef}
          onTouchStart={(event) => {
            if (scrollRef.current.scrollTop === 0) pullStartRef.current = event.touches[0].clientY
          }}
          onTouchMove={(event) => {
            if (pullStartRef.current === null) return
            const delta = Math.max(0, Math.min(event.touches[0].clientY - pullStartRef.current, 90))
            setPullAmount(delta)
          }}
          onTouchEnd={() => {
            if (pullAmount > 60) load(tab, true)
            pullStartRef.current = null
            setPullAmount(0)
          }}
        >
          {(pullAmount > 0 || refreshing) ? <div className="pull-indicator">{refreshing ? 'Atualizando...' : 'Puxe para atualizar'}</div> : null}
          {loading ? <p className="subtle-text">Carregando ranking...</p> : null}
          {!loading && data.entries.length === 0 ? <p className="subtle-text">Nenhum recorde ainda.</p> : null}
          {data.entries.map((entry, index) => (
            <div key={entry.id ?? `${entry.playerId}-${index}`} className={`leader-row ${entry.name === playerName ? 'self' : ''}`}>
              <span>#{entry.rank}</span>
              <strong>{entry.name}</strong>
              <span>{entry.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
