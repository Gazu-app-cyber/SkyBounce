import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell.jsx'
import AdBanner from '../components/game/AdBanner.jsx'
import AdOverlay from '../components/game/AdOverlay.jsx'
import GameCanvas from '../components/game/GameCanvas.jsx'
import GameOverModal from '../components/game/GameOverModal.jsx'
import IAPModal from '../components/game/IAPModal.jsx'
import LeaderboardModal from '../components/game/LeaderboardModal.jsx'
import ScoreDisplay from '../components/game/ScoreDisplay.jsx'
import ShopModal from '../components/game/ShopModal.jsx'
import StatsModal from '../components/game/StatsModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import useAudio from '../hooks/useAudio.js'
import usePlayerProfile from '../hooks/usePlayerProfile.js'
import useRouterModal from '../hooks/useRouterModal.js'
import { GAME, MAP_THEMES, SHOP_ITEMS, SKINS, getDifficulty } from '../lib/gameConfig.js'

function getWeekKey() {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${year}-W${week}`
}

export default function GamePage() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const { currentModal, openModal, closeModal } = useRouterModal()
  const { profile, loading, deleteState, updateProfile, submitRun, completeRealPurchase, deleteAccount } = usePlayerProfile(session)
  const audio = useAudio()
  const [gameState, setGameState] = useState('idle')
  const [score, setScore] = useState(0)
  const [sessionCoins, setSessionCoins] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [hasUsedContinue, setHasUsedContinue] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [timeSurvived, setTimeSurvived] = useState(0)
  const [showIap, setShowIap] = useState(false)
  const [showAd, setShowAd] = useState(null)
  const [shopTab, setShopTab] = useState('skins')
  const pendingActionRef = useRef(null)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)
  const soundOnRef = useRef(true)

  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startGame = useCallback(() => {
    setScore(0)
    setSessionCoins(0)
    setHasUsedContinue(false)
    setTimeSurvived(0)
    startTimeRef.current = Date.now()
    stopTimer()
    timerRef.current = window.setInterval(() => {
      setTimeSurvived(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    if (soundOnRef.current) audio.startMusic()
    setGameState('playing')
  }, [audio, stopTimer])

  const resumeAfterContinue = useCallback(() => {
    setHasUsedContinue(true)
    startTimeRef.current = Date.now() - timeSurvived * 1000
    stopTimer()
    timerRef.current = window.setInterval(() => {
      setTimeSurvived(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    if (soundOnRef.current) audio.startMusic()
    setGameState('playing')
  }, [audio, stopTimer, timeSurvived])

  useEffect(() => {
    if (currentModal || showIap) audio.pauseMusic()
    else if (gameState === 'playing') audio.resumeMusic()
  }, [audio, currentModal, gameState, showIap])

  const handleGameOver = useCallback(async () => {
    stopTimer()
    audio.stopMusic()
    if (soundOnRef.current) audio.playGameOver()
    setGameState('gameover')
    if (!profile) return
    await updateProfile({
      totalRuns: profile.totalRuns + 1,
      totalScore: profile.totalScore + score,
      totalPlayMs: profile.totalPlayMs + timeSurvived * 1000,
      coins: profile.coins + sessionCoins,
      bestScore: Math.max(profile.bestScore, score),
      bestTimeMs: Math.max(profile.bestTimeMs, timeSurvived * 1000),
      lastPlayedAt: Date.now(),
    }).catch(() => null)
    setGamesPlayed((current) => current + 1)
    if (score > 0) {
      await submitRun({
        playerId: profile.playerId,
        name: profile.name,
        score,
        survivalMs: timeSurvived * 1000,
        tapCount: score + timeSurvived,
        maxSpeed: getDifficulty(score).speed * 100,
        sessionStartedAt: startTimeRef.current,
        createdAt: Date.now(),
        weekKey: getWeekKey(),
        skin: profile.selectedSkin,
      }).catch(() => null)
    }
  }, [audio, profile, score, sessionCoins, stopTimer, submitRun, timeSurvived, updateProfile])

  useEffect(() => () => {
    stopTimer()
    audio.stopMusic()
  }, [audio, stopTimer])

  if (loading) return <div className="screen-loader">Carregando jogo...</div>

  const activeMap = profile?.selectedMap || 'space'
  const themeConfig = MAP_THEMES[activeMap] || MAP_THEMES.space

  return (
    <AppShell>
      <main className="game-page">
        <section className="game-stage">
          <GameCanvas
            isPlaying={gameState === 'playing'}
            onScore={() => setScore((current) => {
              const next = current + 1
              if (soundOnRef.current && next % 10 === 0) audio.playScore()
              return next
            })}
            onCoin={() => {
              setSessionCoins((current) => current + 1)
              if (soundOnRef.current) audio.playCoin()
            }}
            onGameOver={handleGameOver}
            onJump={() => { if (soundOnRef.current) audio.playJump() }}
            score={score}
            skin={profile?.selectedSkin || 'default'}
            mapTheme={activeMap}
          />
          {gameState === 'playing' ? <ScoreDisplay score={score} coins={sessionCoins} /> : null}
          {gameState === 'idle' ? (
            <div className="menu-overlay">
              <div className="menu-header">
                <h1>Sky Bounce</h1>
                <p>Toque para voar</p>
                <div className="theme-pill">{themeConfig.emoji} {themeConfig.name}</div>
              </div>
              <div className="menu-center">
                <button className="play-button" onClick={startGame}>▶</button>
                <div className="subtle-text">Recorde: <strong>{profile?.bestScore || 0}</strong></div>
              </div>
              <div className="menu-actions">
                <button className="menu-icon-button" onClick={() => openModal('shop')}>Loja</button>
                <button className="menu-icon-button" onClick={() => openModal('leaderboard')}>Ranking</button>
                <button className="menu-icon-button" onClick={() => openModal('stats')}>Stats</button>
                <button className="menu-icon-button" onClick={() => setSoundOn((current) => !current)}>{soundOn ? 'Som On' : 'Som Off'}</button>
              </div>
            </div>
          ) : null}
          {gameState === 'gameover' ? (
            <GameOverModal
              score={score}
              highScore={profile?.bestScore || 0}
              isNewRecord={score > (profile?.bestScore || 0) && score > 0}
              coinsEarned={sessionCoins}
              timeSurvived={timeSurvived}
              onRestart={() => {
                const shouldShowAd = !profile?.adFree && gamesPlayed > 0 && gamesPlayed % GAME.GAMES_BETWEEN_ADS === 0
                if (shouldShowAd) {
                  pendingActionRef.current = 'restart'
                  setShowAd('interstitial')
                } else startGame()
              }}
              onBackToMenu={() => {
                stopTimer()
                audio.stopMusic()
                setGameState('idle')
              }}
              onWatchAd={() => {
                if (hasUsedContinue) return
                if ((profile?.revives ?? 0) > 0) {
                  updateProfile({ revives: profile.revives - 1 }).catch(() => null)
                  resumeAfterContinue()
                } else {
                  pendingActionRef.current = 'continue'
                  setShowAd('rewarded')
                }
              }}
              canWatchAd={!hasUsedContinue && !profile?.adFree}
              extraLives={profile?.revives || 0}
            />
          ) : null}
        </section>

        <AdBanner show={gameState !== 'playing' && !profile?.adFree} />
        <ShopModal
          open={currentModal === 'shop'}
          onClose={closeModal}
          profile={profile}
          activeTab={shopTab}
          onTabChange={setShopTab}
          onPurchaseSkin={async (skinId) => {
            const skin = SKINS[skinId]
            if (!profile || profile.coins < skin.price) return
            await updateProfile({ coins: profile.coins - skin.price, ownedSkins: [...new Set([...profile.ownedSkins, skinId])], selectedSkin: skinId }).catch(() => null)
          }}
          onPurchaseMapTheme={async (mapId) => {
            const map = MAP_THEMES[mapId]
            if (!profile || profile.coins < map.price) return
            await updateProfile({ coins: profile.coins - map.price, ownedMaps: [...new Set([...profile.ownedMaps, mapId])], selectedMap: mapId }).catch(() => null)
          }}
          onPurchaseItem={async (itemId, isAdReward) => {
            if (!profile) return
            if (isAdReward) {
              pendingActionRef.current = 'coins'
              setShowAd('rewarded')
              return
            }
            const item = SHOP_ITEMS[itemId]
            if (profile.coins < item.price) return
            if (itemId === 'extra_lives_3') await updateProfile({ revives: profile.revives + 3, coins: profile.coins - item.price }).catch(() => null)
            if (itemId === 'extra_lives_10') await updateProfile({ revives: profile.revives + 10, coins: profile.coins - item.price }).catch(() => null)
          }}
          onSelectSkin={(skinId) => updateProfile({ selectedSkin: skinId }).catch(() => null)}
          onSelectMap={(mapId) => updateProfile({ selectedMap: mapId }).catch(() => null)}
          onOpenIAP={() => setShowIap(true)}
        />
        <LeaderboardModal open={currentModal === 'leaderboard'} onClose={closeModal} playerId={profile?.playerId} playerName={profile?.name} />
        <StatsModal
          open={currentModal === 'stats'}
          onClose={closeModal}
          profile={profile}
          onDeleteAccount={async () => {
            await deleteAccount()
            signOut()
            navigate('/login', { replace: true })
          }}
          onLogout={() => {
            signOut()
            navigate('/login', { replace: true })
          }}
        />
        <IAPModal
          open={showIap}
          onClose={() => setShowIap(false)}
          onPurchaseComplete={async () => {
            await completeRealPurchase('remove_ads').catch(() => null)
            setShowIap(false)
          }}
          processing={false}
        />
        {showAd ? (
          <AdOverlay
            type={showAd === 'interstitial' ? 'interstitial' : 'rewarded'}
            onClose={() => {
              const action = pendingActionRef.current
              pendingActionRef.current = null
              setShowAd(null)
              if (action === 'restart') startGame()
              if (action === 'continue') resumeAfterContinue()
              if (action === 'coins' && profile) updateProfile({ coins: profile.coins + 50 }).catch(() => null)
            }}
            onReward={() => {}}
          />
        ) : null}
        {deleteState.loading ? <div className="toast-message">Excluindo conta...</div> : null}
      </main>
    </AppShell>
  )
}
