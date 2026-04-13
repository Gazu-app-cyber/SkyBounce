import { getDifficulty } from '../../lib/gameConfig'

export default function ScoreDisplay({ score, coins }) {
  const difficulty = getDifficulty(score)

  return (
    <div className="score-display">
      <div>
        <strong>{score}</strong>
        <span>{difficulty.label}</span>
      </div>
      <div className="coin-pill">
        <span>🪙</span>
        <strong>{coins}</strong>
      </div>
    </div>
  )
}
