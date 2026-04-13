import { useState } from 'react'

export default function StatsModal({ open, onClose, profile, onDeleteAccount, onLogout }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!open || !profile) return null

  const averageScore = profile.totalRuns > 0 ? Math.round(profile.totalScore / profile.totalRuns) : 0

  return (
    <div className="modal-overlay">
      <div className="panel modal-panel">
        <div className="panel-header">
          <div>
            <h2>Estatisticas</h2>
            <p className="subtle-text">{profile.name}</p>
          </div>
          <button className="close-button" onClick={onClose}>Fechar</button>
        </div>

        <div className="stats-grid">
          <div><span>Melhor Pontuacao</span><strong>{profile.bestScore}</strong></div>
          <div><span>Total de Partidas</span><strong>{profile.totalRuns}</strong></div>
          <div><span>Media de Pontos</span><strong>{averageScore}</strong></div>
          <div><span>Total de Moedas</span><strong>{profile.coins}</strong></div>
        </div>

        <div className="panel section-panel">
          <span className="subtle-text">Skins desbloqueadas</span>
          <strong>{profile.ownedSkins.length} / 8</strong>
        </div>

        <div className="button-stack">
          <button className="button button-secondary" onClick={onLogout}>Trocar Jogador</button>
          {!confirmDelete ? (
            <button className="button button-danger" onClick={() => setConfirmDelete(true)}>Excluir Conta</button>
          ) : (
            <>
              <div className="panel warning-panel">
                <strong>Tem certeza?</strong>
                <span>Todos os dados serao excluidos permanentemente.</span>
              </div>
              <button className="button button-danger" onClick={onDeleteAccount}>Confirmar Exclusao</button>
              <button className="button button-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
