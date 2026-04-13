import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  startTransition,
} from 'react'
import './App.css'
import { MAP_SKINS, SHOP_PACKS, STORE_PRODUCTS } from './gameData'
import { useModalRoute } from './hooks/useModalRoute'
import { usePlayerProfile } from './hooks/usePlayerProfile'
import {
  buildRunChecksum,
  fetchLeaderboard,
  submitScore,
} from './services/leaderboard'
import {
  ensureAudioReady,
  playCrashSfx,
  playJumpSfx,
  startMusicLoop,
  updateAudioMix,
} from './audio'
import { showInterstitialAd, showRewardedAd } from './services/platform'

const GAME_WIDTH = 360
const GAME_HEIGHT = 640
const PLAYER_X = 96
const PLAYER_RADIUS = 18
const OBSTACLE_WIDTH = 58
const BASE_GAP = 188
const BASE_SPEED = 200
const SPAWN_INTERVAL = 1.28

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function formatTime(ms) {
  return `${(ms / 1000).toFixed(1)}s`
}

function createInitialGame() {
  return {
    playerY: GAME_HEIGHT * 0.48,
    velocityY: 0,
    elapsedMs: 0,
    score: 0,
    obstacleTimer: 0,
    obstacles: [],
    tapCount: 0,
    maxSpeed: BASE_SPEED,
    continueUsed: false,
    sessionStartedAt: Date.now(),
    coinsEarned: 0,
  }
}

function createObstacle(elapsedMs) {
  const gapHeight = clamp(BASE_GAP - elapsedMs * 0.004, 126, BASE_GAP)
  return {
    id: crypto.randomUUID(),
    x: GAME_WIDTH + 40,
    gapY: 170 + Math.random() * 300,
    gapHeight,
    counted: false,
  }
}

function isColliding(state) {
  if (state.playerY < PLAYER_RADIUS || state.playerY > GAME_HEIGHT - PLAYER_RADIUS - 10) {
    return true
  }

  return state.obstacles.some((obstacle) => {
    const overlapsX =
      PLAYER_X + PLAYER_RADIUS > obstacle.x &&
      PLAYER_X - PLAYER_RADIUS < obstacle.x + OBSTACLE_WIDTH
    const insideGap =
      state.playerY > obstacle.gapY - obstacle.gapHeight * 0.5 &&
      state.playerY < obstacle.gapY + obstacle.gapHeight * 0.5
    return overlapsX && !insideGap
  })
}

function drawWorld(ctx, state, skin) {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  gradient.addColorStop(0, skin.skyTop)
  gradient.addColorStop(1, skin.skyBottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  ctx.globalAlpha = 0.22
  for (let index = 0; index < 5; index += 1) {
    const y = 120 + index * 105 - ((state.elapsedMs * 0.02 + index * 30) % 40)
    ctx.fillStyle = skin.glow
    ctx.beginPath()
    ctx.ellipse(GAME_WIDTH * 0.5, y, 160 - index * 14, 36, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = `${skin.detail}22`
  for (let index = 0; index < 18; index += 1) {
    const x = ((index * 67 + state.elapsedMs * 0.03) % (GAME_WIDTH + 60)) - 30
    const y = 60 + ((index * 97) % 520)
    ctx.beginPath()
    ctx.arc(x, y, (index % 3) + 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  state.obstacles.forEach((obstacle) => {
    const topHeight = obstacle.gapY - obstacle.gapHeight * 0.5
    const bottomY = obstacle.gapY + obstacle.gapHeight * 0.5
    ctx.fillStyle = skin.obstacle
    ctx.shadowColor = skin.glow
    ctx.shadowBlur = 12
    ctx.fillRect(obstacle.x, 0, OBSTACLE_WIDTH, topHeight)
    ctx.fillRect(obstacle.x, bottomY, OBSTACLE_WIDTH, GAME_HEIGHT - bottomY)
    ctx.shadowBlur = 0
  })

  ctx.fillStyle = skin.detail
  ctx.beginPath()
  ctx.arc(PLAYER_X, state.playerY, PLAYER_RADIUS, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = `${skin.accent}88`
  ctx.beginPath()
  ctx.arc(PLAYER_X - 6, state.playerY - 6, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = `${skin.detail}10`
  ctx.fillRect(0, GAME_HEIGHT - 12, GAME_WIDTH, 12)
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="ghost-button" onClick={onClose}>
            Fechar
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

function AdBanner({ hidden }) {
  if (hidden) {
    return null
  }

  return (
    <div className="ad-banner">
      <span>Anuncio banner</span>
      <strong>SkyBounce Boost</strong>
      <span>Espaco reservado para rede mobile/web</span>
    </div>
  )
}

function ScoreDisplay({ score, bestScore, coins }) {
  return (
    <div className="score-display">
      <div>
        <span>Score</span>
        <strong>{score}</strong>
      </div>
      <div>
        <span>Recorde</span>
        <strong>{bestScore}</strong>
      </div>
      <div>
        <span>Moedas</span>
        <strong>{coins}</strong>
      </div>
    </div>
  )
}

function GameOverCard({
  summary,
  bestScore,
  canContinue,
  continueBusy,
  onRetry,
  onMenu,
  onContinue,
}) {
  return (
    <div className="gameover-card">
      <span className="eyebrow">Derrota</span>
      <h2>Quase la.</h2>
      <p>Voce ainda pode voltar ao jogo sem fechar o app.</p>
      <div className="summary-grid">
        <div>
          <span>Pontuacao</span>
          <strong>{summary.score}</strong>
        </div>
        <div>
          <span>Tempo</span>
          <strong>{formatTime(summary.survivalMs)}</strong>
        </div>
        <div>
          <span>Recorde</span>
          <strong>{bestScore}</strong>
        </div>
      </div>
      <div className="action-stack">
        <button className="primary-button" onClick={onRetry}>
          Tentar Novamente
        </button>
        <button className="secondary-button" onClick={onMenu}>
          Voltar ao Menu
        </button>
        <button
          className="reward-button"
          disabled={!canContinue || continueBusy}
          onClick={onContinue}
        >
          {continueBusy ? 'Carregando anuncio...' : 'Continuar com anuncio'}
        </button>
      </div>
    </div>
  )
}

function MenuScreen({ profile, skin, onPlay, onOpenModal }) {
  return (
    <div className="menu-panel">
      <div className="menu-copy">
        <span className="eyebrow">SkyBounce</span>
        <h1>Toque, suba e sobreviva.</h1>
        <p>
          Sessao curta, curva de dificuldade crescente e loop de monetizacao pronto
          para web e mobile.
        </p>
      </div>
      <div className="menu-stats">
        <div>
          <span>Jogador</span>
          <strong>{profile.name}</strong>
        </div>
        <div>
          <span>Tema</span>
          <strong>{skin.name}</strong>
        </div>
        <div>
          <span>Continues</span>
          <strong>{profile.revives}</strong>
        </div>
        <div>
          <span>Recorde</span>
          <strong>{profile.bestScore}</strong>
        </div>
      </div>
      <div className="menu-actions">
        <button className="primary-button large-button" onClick={onPlay}>
          Jogar Agora
        </button>
        <button className="secondary-button" onClick={() => onOpenModal('shop')}>
          Loja e IAP
        </button>
        <button className="secondary-button" onClick={() => onOpenModal('customize')}>
          Personalizar mapa
        </button>
        <button className="secondary-button" onClick={() => onOpenModal('leaderboard')}>
          Leaderboard global
        </button>
        <button className="secondary-button" onClick={() => onOpenModal('stats')}>
          Estatisticas
        </button>
      </div>
    </div>
  )
}

function ShopModal({
  profile,
  onClose,
  onBuyRevivesWithCoins,
  onRealMoneyPurchase,
  purchasePending,
}) {
  return (
    <ModalShell title="Loja" onClose={onClose}>
      <div className="shop-block">
        <h3>Compra com dinheiro real</h3>
        <div className="card-list">
          {STORE_PRODUCTS.map((product) => (
            <article className="store-card" key={product.id}>
              <div>
                <strong>{product.title}</strong>
                <p>{product.description}</p>
              </div>
              <button
                className="primary-button"
                disabled={purchasePending || (product.id === 'remove_ads' && profile.adFree)}
                onClick={() => onRealMoneyPurchase(product.id)}
              >
                {product.id === 'remove_ads' && profile.adFree ? 'Ativo' : product.displayPrice}
              </button>
            </article>
          ))}
        </div>
      </div>
      <div className="shop-block">
        <h3>Moedas e utilitarios</h3>
        <div className="card-list">
          {SHOP_PACKS.map((pack) => (
            <article className="store-card" key={pack.id}>
              <div>
                <strong>{pack.title}</strong>
                <p>{pack.description}</p>
              </div>
              <button
                className="secondary-button"
                disabled={pack.rewardOnly}
                onClick={onBuyRevivesWithCoins}
              >
                {pack.rewardOnly ? 'Obtido via IAP de moedas' : `${pack.priceCoins} moedas`}
              </button>
            </article>
          ))}
        </div>
      </div>
      <p className="note">
        Remover anuncios usa apenas dinheiro real e o estado da compra e restaurado na abertura do app.
      </p>
    </ModalShell>
  )
}

function CustomizeModal({ profile, selectedSkin, onClose, onSelectSkin, onBuySkin }) {
  return (
    <ModalShell title="Skins de mapa" onClose={onClose}>
      <div className="skin-grid">
        {MAP_SKINS.map((skin) => {
          const owned = profile.ownedSkins.includes(skin.id)
          const unlockLabel =
            skin.unlockType === 'default'
              ? 'Gratis'
              : skin.unlockType === 'score'
                ? `Liberar no score ${skin.unlockValue}`
                : `${skin.unlockValue} moedas`

          return (
            <button
              key={skin.id}
              className={`skin-card ${selectedSkin.id === skin.id ? 'selected' : ''}`}
              onClick={() => (owned ? onSelectSkin(skin.id) : onBuySkin(skin.id))}
            >
              <span
                className="skin-preview"
                style={{
                  '--skin-top': skin.skyTop,
                  '--skin-bottom': skin.skyBottom,
                  '--skin-accent': skin.accent,
                }}
              />
              <strong>{skin.name}</strong>
              <small>{skin.description}</small>
              <span>{owned ? 'Selecionar' : unlockLabel}</span>
            </button>
          )
        })}
      </div>
    </ModalShell>
  )
}

function LeaderboardModal({
  onClose,
  leaderboard,
  activeScope,
  setActiveScope,
  refreshLeaderboard,
  refreshing,
}) {
  const deferredEntries = useDeferredValue(leaderboard.entries)
  const pullRef = useRef({ startY: 0, active: false, amount: 0 })
  const [pullAmount, setPullAmount] = useState(0)

  function onTouchStart(event) {
    const container = event.currentTarget
    if (container.scrollTop > 0) {
      pullRef.current.active = false
      return
    }

    pullRef.current = {
      startY: event.touches[0].clientY,
      active: true,
      amount: 0,
    }
  }

  function onTouchMove(event) {
    if (!pullRef.current.active) {
      return
    }

    const delta = Math.max(0, event.touches[0].clientY - pullRef.current.startY)
    pullRef.current.amount = Math.min(82, delta * 0.55)
    setPullAmount(pullRef.current.amount)
  }

  function onTouchEnd() {
    if (pullRef.current.amount > 56) {
      refreshLeaderboard(activeScope)
    }

    pullRef.current = { startY: 0, active: false, amount: 0 }
    setPullAmount(0)
  }

  return (
    <ModalShell title="Leaderboard" onClose={onClose}>
      <div className="scope-switch">
        <button className={activeScope === 'global' ? 'active' : ''} onClick={() => setActiveScope('global')}>
          Top global
        </button>
        <button className={activeScope === 'weekly' ? 'active' : ''} onClick={() => setActiveScope('weekly')}>
          Ranking semanal
        </button>
      </div>
      <div
        className="leaderboard-list"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={`pull-indicator ${pullAmount > 0 || refreshing ? 'visible' : ''}`}>
          {refreshing ? 'Atualizando...' : pullAmount > 56 ? 'Solte para atualizar' : 'Puxe para atualizar'}
        </div>
        {deferredEntries.map((entry) => (
          <article className="leader-row" key={entry.id ?? `${entry.playerId}-${entry.rank}`}>
            <strong>#{entry.rank}</strong>
            <span>{entry.name}</span>
            <span>{entry.score} pts</span>
          </article>
        ))}
      </div>
      <p className="note">
        Posicao do jogador: {leaderboard.playerRank ? `#${leaderboard.playerRank}` : 'sem colocacao ainda'}
      </p>
    </ModalShell>
  )
}

function StatsModal({
  profile,
  error,
  deleteState,
  onClose,
  onChangeName,
  onVolumeChange,
  onDeleteAccount,
}) {
  const [draftName, setDraftName] = useState(profile.name)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setDraftName(profile.name)
  }, [profile.name])

  return (
    <ModalShell title="Estatisticas" onClose={onClose}>
      <div className="stats-grid">
        <div>
          <span>Recorde</span>
          <strong>{profile.bestScore}</strong>
        </div>
        <div>
          <span>Total de partidas</span>
          <strong>{profile.totalRuns}</strong>
        </div>
        <div>
          <span>Tempo jogado</span>
          <strong>{formatTime(profile.totalPlayMs)}</strong>
        </div>
        <div>
          <span>Melhor sobrevivencia</span>
          <strong>{formatTime(profile.bestTimeMs)}</strong>
        </div>
      </div>
      <label className="field">
        <span>Nome no ranking</span>
        <input
          value={draftName}
          maxLength={18}
          onChange={(event) => setDraftName(event.target.value)}
        />
      </label>
      <button className="secondary-button" onClick={() => onChangeName(draftName)}>
        Salvar nome
      </button>
      <div className="slider-group">
        <label className="field">
          <span>Volume SFX</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={profile.settings.sfxVolume}
            onChange={(event) => onVolumeChange('sfxVolume', Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Volume musica</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={profile.settings.musicVolume}
            onChange={(event) => onVolumeChange('musicVolume', Number(event.target.value))}
          />
        </label>
      </div>
      <div className="danger-zone">
        <strong>Delete Account</strong>
        <p>Apaga progresso, estatisticas, compras locais e dados sincronizados.</p>
        {confirming ? (
          <div className="confirm-row">
            <button className="danger-button" disabled={deleteState.loading} onClick={onDeleteAccount}>
              {deleteState.loading ? 'Excluindo...' : 'Confirmar exclusao'}
            </button>
            <button className="secondary-button" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button className="ghost-button" onClick={() => setConfirming(true)}>
            Delete Account
          </button>
        )}
        {deleteState.success ? <span className="success-text">Conta excluida com sucesso.</span> : null}
      </div>
      {error ? <p className="error-text">{error}</p> : null}
    </ModalShell>
  )
}

function App() {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const gameRef = useRef(createInitialGame())
  const [screen, setScreen] = useState('menu')
  const [summary, setSummary] = useState({ score: 0, survivalMs: 0 })
  const [frameState, setFrameState] = useState(createInitialGame())
  const [continueBusy, setContinueBusy] = useState(false)
  const [refreshingBoard, setRefreshingBoard] = useState(false)
  const [leaderboardScope, setLeaderboardScope] = useState('global')
  const [leaderboard, setLeaderboard] = useState({ entries: [], playerRank: null, mode: 'local' })
  const [runCounter, setRunCounter] = useState(0)
  const { modal, openModal, closeModal } = useModalRoute()
  const {
    profile,
    error,
    purchasePending,
    deleteState,
    updateName,
    updateVolumes,
    recordRun,
    buySkin,
    buyRevivesWithCoins,
    purchaseRealMoney,
    consumeRevive,
    selectSkin,
    deleteAccount,
  } = usePlayerProfile()

  const selectedSkin =
    MAP_SKINS.find((skin) => skin.id === profile.selectedSkin) ?? MAP_SKINS[0]

  useEffect(() => {
    updateAudioMix({
      musicVolume: profile.settings.musicVolume,
      sfxVolume: profile.settings.sfxVolume,
      musicPaused: Boolean(modal),
    })
    startMusicLoop(profile.settings.musicVolume)
  }, [profile.settings.musicVolume, profile.settings.sfxVolume, modal])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      drawWorld(ctx, frameState, selectedSkin)
    }
  }, [frameState, selectedSkin])

  useEffect(() => {
    refreshLeaderboard('global')
  }, [])

  async function refreshLeaderboard(scope = leaderboardScope) {
    setRefreshingBoard(true)
    try {
      const data = await fetchLeaderboard({
        scope,
        playerId: profile.playerId,
        playerName: profile.name,
      })
      startTransition(() => {
        setLeaderboard(data)
      })
    } finally {
      setRefreshingBoard(false)
    }
  }

  function stopLoop() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }

  async function endRun(finalState) {
    const runSummary = {
      score: finalState.score,
      survivalMs: finalState.elapsedMs,
    }
    setSummary(runSummary)
    setScreen('gameover')
    setRunCounter((current) => current + 1)

    const nextProfile = await recordRun({
      score: finalState.score,
      survivalMs: finalState.elapsedMs,
      coinsEarned: finalState.coinsEarned,
    })

    const payload = {
      playerId: nextProfile.playerId,
      name: nextProfile.name,
      score: finalState.score,
      survivalMs: Math.round(finalState.elapsedMs),
      tapCount: finalState.tapCount,
      maxSpeed: Math.round(finalState.maxSpeed),
      sessionStartedAt: finalState.sessionStartedAt,
      createdAt: Date.now(),
    }
    payload.checksum = buildRunChecksum(payload)
    await submitScore(payload)
    await refreshLeaderboard(leaderboardScope)

    if ((runCounter + 1) % 3 === 0 && !nextProfile.adFree) {
      await showInterstitialAd()
    }
  }

  function runLoopFromCurrentState() {
    let lastTime = performance.now()

    const tick = (now) => {
      const delta = Math.min(0.032, (now - lastTime) / 1000)
      lastTime = now
      const current = gameRef.current

      current.elapsedMs += delta * 1000
      current.velocityY += 1460 * delta
      current.playerY += current.velocityY * delta
      current.maxSpeed = Math.max(current.maxSpeed, BASE_SPEED + current.elapsedMs * 0.01)

      const speed = BASE_SPEED + current.elapsedMs * 0.01
      current.obstacleTimer += delta
      if (current.obstacleTimer > Math.max(0.72, SPAWN_INTERVAL - current.elapsedMs * 0.00008)) {
        current.obstacleTimer = 0
        current.obstacles.push(createObstacle(current.elapsedMs))
      }

      current.obstacles = current.obstacles
        .map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - speed * delta,
        }))
        .filter((obstacle) => obstacle.x > -OBSTACLE_WIDTH - 20)

      current.obstacles.forEach((obstacle) => {
        if (!obstacle.counted && obstacle.x + OBSTACLE_WIDTH < PLAYER_X) {
          obstacle.counted = true
          current.score += 1
          current.coinsEarned += 6
        }
      })

      setFrameState({ ...current, obstacles: [...current.obstacles] })

      if (isColliding(current)) {
        stopLoop()
        playCrashSfx(profile.settings.sfxVolume)
        endRun(current)
        return
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
  }

  function startGame() {
    ensureAudioReady()
    stopLoop()
    const initial = createInitialGame()
    gameRef.current = initial
    setFrameState(initial)
    setSummary({ score: 0, survivalMs: 0 })
    setScreen('playing')
    runLoopFromCurrentState()
  }

  function jump() {
    if (screen === 'menu') {
      startGame()
      return
    }

    if (screen !== 'playing') {
      return
    }

    ensureAudioReady()
    const current = gameRef.current
    current.velocityY = -520
    current.tapCount += 1
    playJumpSfx(profile.settings.sfxVolume)
  }

  async function continueWithReward() {
    setContinueBusy(true)
    try {
      await showRewardedAd()
      const current = gameRef.current
      current.playerY = GAME_HEIGHT * 0.5
      current.velocityY = -260
      current.continueUsed = true
      current.obstacles = current.obstacles.filter(
        (obstacle) => obstacle.x < PLAYER_X - 90 || obstacle.x > PLAYER_X + 90,
      )
      setScreen('playing')
      runLoopFromCurrentState()
    } finally {
      setContinueBusy(false)
    }
  }

  async function continueWithTokenOrReward() {
    if (profile.revives > 0) {
      const consumed = await consumeRevive()
      if (consumed) {
        const current = gameRef.current
        current.playerY = GAME_HEIGHT * 0.5
        current.velocityY = -260
        current.continueUsed = true
        current.obstacles = current.obstacles.filter(
          (obstacle) => obstacle.x < PLAYER_X - 90 || obstacle.x > PLAYER_X + 90,
        )
        setScreen('playing')
        runLoopFromCurrentState()
        return
      }
    }

    await continueWithReward()
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.code === 'Space') {
        event.preventDefault()
        jump()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      stopLoop()
    }
  }, [screen, profile.settings.sfxVolume])

  return (
    <div
      className="app-shell"
      style={{
        '--skin-top': selectedSkin.skyTop,
        '--skin-bottom': selectedSkin.skyBottom,
        '--skin-accent': selectedSkin.accent,
      }}
    >
      <main className="mobile-shell">
        <ScoreDisplay
          score={frameState.score}
          bestScore={profile.bestScore}
          coins={profile.coins}
        />

        <section className="game-stage">
          <div className="device-frame">
            <canvas
              ref={canvasRef}
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              className="game-canvas"
              onPointerDown={jump}
            />

            {screen === 'menu' ? (
              <MenuScreen
                profile={profile}
                skin={selectedSkin}
                onPlay={startGame}
                onOpenModal={openModal}
              />
            ) : null}

            {screen === 'playing' ? (
              <div className="tap-hint">
                <span>Toque para impulsionar a bolinha.</span>
                <strong>{profile.revives} continues guardados</strong>
              </div>
            ) : null}

            {screen === 'gameover' ? (
              <div className="overlay-center">
                <GameOverCard
                  summary={summary}
                  bestScore={profile.bestScore}
                  canContinue={!gameRef.current.continueUsed}
                  continueBusy={continueBusy}
                  onRetry={startGame}
                  onMenu={() => setScreen('menu')}
                  onContinue={continueWithTokenOrReward}
                />
              </div>
            ) : null}
          </div>
        </section>

        <div className="meta-strip">
          <span>Leaderboard {leaderboard.mode === 'local' ? 'local dev' : 'online'}</span>
          <span>Skin ativa: {selectedSkin.name}</span>
          <span>Anuncios: {profile.adFree ? 'desativados' : 'ativos'}</span>
        </div>

        {error ? <p className="error-text floating-error">{error}</p> : null}
      </main>

      {modal === 'shop' ? (
        <ShopModal
          profile={profile}
          onClose={closeModal}
          onBuyRevivesWithCoins={buyRevivesWithCoins}
          onRealMoneyPurchase={purchaseRealMoney}
          purchasePending={purchasePending}
        />
      ) : null}

      {modal === 'customize' ? (
        <CustomizeModal
          profile={profile}
          selectedSkin={selectedSkin}
          onClose={closeModal}
          onSelectSkin={selectSkin}
          onBuySkin={buySkin}
        />
      ) : null}

      {modal === 'leaderboard' ? (
        <LeaderboardModal
          onClose={closeModal}
          leaderboard={leaderboard}
          activeScope={leaderboardScope}
          setActiveScope={(scope) => {
            setLeaderboardScope(scope)
            refreshLeaderboard(scope)
          }}
          refreshLeaderboard={refreshLeaderboard}
          refreshing={refreshingBoard}
        />
      ) : null}

      {modal === 'stats' ? (
        <StatsModal
          profile={profile}
          error={error}
          deleteState={deleteState}
          onClose={closeModal}
          onChangeName={updateName}
          onVolumeChange={updateVolumes}
          onDeleteAccount={deleteAccount}
        />
      ) : null}

      <AdBanner hidden={profile.adFree} />
    </div>
  )
}

export default App
