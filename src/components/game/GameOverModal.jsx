function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`
}

export default function GameOverModal({
  score,
  highScore,
  isNewRecord,
  coinsEarned,
  timeSurvived,
  onRestart,
  onBackToMenu,
  onWatchAd,
  canWatchAd,
  extraLives,
}) {
  return (
    <div className="modal-overlay">
      <div className="panel modal-panel">
        <div className="panel-header centered">
          <div className="hero-emoji">{isNewRecord ? '🏆' : '💥'}</div>
          <h2>{isNewRecord ? 'Novo Recorde!' : 'Fim de Jogo'}</h2>
        </div>

        <div className="stats-grid compact">
          <div><span>Pontos</span><strong>{score}</strong></div>
          <div><span>Tempo</span><strong>{formatTime(timeSurvived)}</strong></div>
          <div><span>Moedas</span><strong>{coinsEarned}</strong></div>
        </div>

        <p className="subtle-text">Recorde: <strong>{Math.max(highScore, score)}</strong></p>

        <div className="button-stack">
          {canWatchAd ? <button className="button button-success" onClick={onWatchAd}>Continuar (Ver Anuncio)</button> : null}
          {extraLives > 0 ? <button className="button button-outline" onClick={onWatchAd}>Usar Vida Extra ({extraLives})</button> : null}
          <button className="button button-primary" onClick={onRestart}>Tentar Novamente</button>
          <button className="button button-secondary" onClick={onBackToMenu}>Voltar ao Menu</button>
        </div>
      </div>
    </div>
  )
}
