import { useEffect, useState } from 'react'

export default function AdOverlay({ type = 'interstitial', onClose, onReward }) {
  const rewarded = type === 'rewarded'
  const duration = rewarded ? 5 : 3
  const [countdown, setCountdown] = useState(duration)
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setCanClose(true)
          onReward?.()
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [onReward])

  return (
    <div className="modal-overlay ad-overlay">
      <div className="panel modal-panel">
        <div className="panel-header centered">
          <div className="hero-emoji">{rewarded ? '🎁' : '📢'}</div>
          <h2>{rewarded ? 'Anuncio Recompensado' : 'Anuncio'}</h2>
          <p className="subtle-text">{rewarded ? 'Assista para ganhar sua recompensa.' : 'Voltamos em instantes.'}</p>
        </div>
        <div className="progress-bar"><div style={{ width: `${((duration - countdown) / duration) * 100}%` }} /></div>
        <p className="subtle-text">{canClose ? 'Pronto!' : `${countdown}s restantes`}</p>
        {canClose ? <button className="button button-primary" onClick={onClose}>Fechar</button> : null}
      </div>
    </div>
  )
}
