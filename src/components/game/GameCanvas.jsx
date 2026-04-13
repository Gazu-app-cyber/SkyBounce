import { useCallback, useEffect, useRef } from 'react'
import { GAME, MAP_THEMES, SKINS, getDifficulty } from '../../lib/gameConfig'

export default function GameCanvas({
  isPlaying,
  onScore,
  onCoin,
  onGameOver,
  onJump,
  score,
  skin = 'default',
  mapTheme = 'space',
}) {
  const theme = MAP_THEMES[mapTheme] || MAP_THEMES.space
  const skinConfig = SKINS[skin] || SKINS.default
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const frameRef = useRef(null)

  const initGame = useCallback((canvas) => {
    stateRef.current = {
      ball: { x: canvas.width * 0.25, y: canvas.height * 0.5, vy: 0, radius: GAME.BALL_RADIUS },
      obstacles: [],
      coins: [],
      particles: [],
      stars: Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.3,
      })),
      frameCount: 0,
      spawnTimer: 0,
      passed: new Set(),
    }
  }, [])

  const spawnObstacle = useCallback((width, height, difficulty) => {
    const gap = GAME.OBSTACLE_GAP * difficulty.gapMultiplier
    const minTop = 60
    const maxTop = height - gap - 60
    const topHeight = Math.random() * (maxTop - minTop) + minTop
    const id = Date.now() + Math.random()
    return {
      obstacle: { x: width + 20, topHeight, gap, width: GAME.OBSTACLE_WIDTH, id },
      coin: Math.random() > 0.4 ? {
        x: width + 20 + GAME.OBSTACLE_WIDTH / 2,
        y: topHeight + gap / 2,
        radius: GAME.COIN_RADIUS,
        collected: false,
        id: id + 0.5,
      } : null,
    }
  }, [])

  const addParticles = useCallback((x, y, color, count = 6) => {
    if (!stateRef.current) return
    for (let index = 0; index < count; index += 1) {
      stateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        color,
        size: Math.random() * 4 + 2,
      })
    }
  }, [])

  const handleTap = useCallback(() => {
    if (!isPlaying || !stateRef.current) return
    stateRef.current.ball.vy = GAME.BOUNCE_FORCE
    onJump?.()
    addParticles(stateRef.current.ball.x, stateRef.current.ball.y + GAME.BALL_RADIUS, skinConfig.color, 4)
  }, [addParticles, isPlaying, onJump, skinConfig.color])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resizeCanvas() {
      const parent = canvas.parentElement
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    if (isPlaying) initGame(canvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [initGame, isPlaying])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function drawBackground(width, height) {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, theme.bgTop)
      bgGrad.addColorStop(0.5, theme.bgMid)
      bgGrad.addColorStop(1, theme.bgBottom)
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)
    }

    function drawIdle(frame) {
      const width = canvas.width
      const height = canvas.height
      drawBackground(width, height)
      for (let index = 0; index < 30; index += 1) {
        const x = (index * 37 + frame * 0.3) % width
        const y = (index * 53) % height
        ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.sin(frame * 0.02 + index) * 0.15})`
        ctx.beginPath()
        ctx.arc(x, y, 1 + Math.sin(frame * 0.01 + index) * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
      const ballY = height * 0.45 + Math.sin(frame * 0.03) * 20
      ctx.save()
      ctx.shadowColor = skinConfig.color
      ctx.shadowBlur = 30
      ctx.fillStyle = skinConfig.color
      ctx.beginPath()
      ctx.arc(width * 0.5, ballY, 24, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      frameRef.current = requestAnimationFrame(() => drawIdle(frame + 1))
    }

    if (!isPlaying) {
      cancelAnimationFrame(frameRef.current)
      drawIdle(0)
      return () => cancelAnimationFrame(frameRef.current)
    }

    const tick = () => {
      const gs = stateRef.current
      if (!gs) return
      const width = canvas.width
      const height = canvas.height
      const difficulty = getDifficulty(score)
      const speed = GAME.OBSTACLE_SPEED_BASE * difficulty.speed

      gs.ball.vy += GAME.GRAVITY
      gs.ball.y += gs.ball.vy
      if (gs.ball.y - gs.ball.radius < 0) {
        gs.ball.y = gs.ball.radius
        gs.ball.vy = 0
      }
      if (gs.ball.y + gs.ball.radius > height) {
        onGameOver()
        return
      }

      gs.spawnTimer += 1
      const spawnInterval = Math.max(70, 120 - score * 0.5)
      if (gs.spawnTimer >= spawnInterval) {
        gs.spawnTimer = 0
        const { obstacle, coin } = spawnObstacle(width, height, difficulty)
        gs.obstacles.push(obstacle)
        if (coin) gs.coins.push(coin)
      }

      gs.obstacles = gs.obstacles.filter((obstacle) => {
        obstacle.x -= speed
        const ball = gs.ball
        const inXRange = ball.x + ball.radius > obstacle.x && ball.x - ball.radius < obstacle.x + obstacle.width
        if (inXRange) {
          const hitTop = ball.y - ball.radius < obstacle.topHeight
          const hitBottom = ball.y + ball.radius > obstacle.topHeight + obstacle.gap
          if (hitTop || hitBottom) {
            addParticles(ball.x, ball.y, '#ef4444', 12)
            onGameOver()
            return false
          }
        }
        if (!gs.passed.has(obstacle.id) && obstacle.x + obstacle.width < ball.x) {
          gs.passed.add(obstacle.id)
          onScore()
          addParticles(ball.x, ball.y, skinConfig.color, 5)
        }
        return obstacle.x + obstacle.width > -20
      })

      gs.coins = gs.coins.filter((coin) => {
        coin.x -= speed
        const dx = gs.ball.x - coin.x
        const dy = gs.ball.y - coin.y
        if (Math.sqrt(dx * dx + dy * dy) < gs.ball.radius + coin.radius) {
          onCoin()
          addParticles(coin.x, coin.y, '#f59e0b', 8)
          return false
        }
        return coin.x > -20
      })

      gs.particles = gs.particles.filter((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= 0.03
        particle.vx *= 0.97
        particle.vy *= 0.97
        return particle.life > 0
      })

      gs.stars.forEach((star) => {
        star.x -= star.speed
        if (star.x < 0) {
          star.x = width
          star.y = Math.random() * height
        }
      })

      drawBackground(width, height)
      if (theme.stars) {
        gs.stars.forEach((star) => {
          ctx.fillStyle = `rgba(255,255,255,${star.opacity})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      gs.obstacles.forEach((obstacle) => {
        const gradient = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + obstacle.width, 0)
        gradient.addColorStop(0, theme.obstacleBase)
        gradient.addColorStop(1, theme.obstacleLight)
        ctx.fillStyle = gradient
        ctx.fillRect(obstacle.x, 0, obstacle.width, obstacle.topHeight)
        ctx.fillStyle = theme.obstacleCap
        ctx.fillRect(obstacle.x - 4, obstacle.topHeight - 16, obstacle.width + 8, 16)

        const bottomY = obstacle.topHeight + obstacle.gap
        ctx.fillStyle = gradient
        ctx.fillRect(obstacle.x, bottomY, obstacle.width, height - bottomY)
        ctx.fillStyle = theme.obstacleCap
        ctx.fillRect(obstacle.x - 4, bottomY, obstacle.width + 8, 16)
      })

      gs.coins.forEach((coin) => {
        const bobY = coin.y + Math.sin(gs.frameCount * 0.08 + coin.id) * 4
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.arc(coin.x, bobY, coin.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.save()
      ctx.shadowColor = skinConfig.color
      ctx.shadowBlur = 20
      ctx.fillStyle = skinConfig.gradient
        ? ctx.createLinearGradient(gs.ball.x - gs.ball.radius, gs.ball.y - gs.ball.radius, gs.ball.x + gs.ball.radius, gs.ball.y + gs.ball.radius)
        : skinConfig.color
      if (skinConfig.gradient) {
        const grad = ctx.fillStyle
        const hueOffset = (gs.frameCount * 3) % 360
        grad.addColorStop(0, `hsl(${hueOffset} 80% 60%)`)
        grad.addColorStop(0.5, `hsl(${(hueOffset + 120) % 360} 80% 60%)`)
        grad.addColorStop(1, `hsl(${(hueOffset + 240) % 360} 80% 60%)`)
      }
      ctx.beginPath()
      ctx.arc(gs.ball.x, gs.ball.y, gs.ball.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      gs.particles.forEach((particle) => {
        ctx.globalAlpha = particle.life
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
      gs.frameCount += 1
      frameRef.current = requestAnimationFrame(tick)
    }

    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [addParticles, initGame, isPlaying, onCoin, onGameOver, onScore, score, skinConfig, spawnObstacle, theme])

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onClick={handleTap}
      onTouchStart={(event) => {
        event.preventDefault()
        handleTap()
      }}
    />
  )
}
