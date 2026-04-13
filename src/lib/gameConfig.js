export const SKINS = {
  default: { id: 'default', name: 'Padrao', color: '#8b5cf6', price: 0, emoji: '⚪' },
  fire: { id: 'fire', name: 'Fogo', color: '#ef4444', price: 100, emoji: '🔥' },
  ice: { id: 'ice', name: 'Gelo', color: '#3b82f6', price: 100, emoji: '❄️' },
  gold: { id: 'gold', name: 'Ouro', color: '#f59e0b', price: 200, emoji: '✨' },
  neon: { id: 'neon', name: 'Neon', color: '#10b981', price: 200, emoji: '💚' },
  cosmic: { id: 'cosmic', name: 'Cosmico', color: '#ec4899', price: 350, emoji: '🌟' },
  rainbow: { id: 'rainbow', name: 'Arco-iris', color: '#8b5cf6', price: 500, emoji: '🌈', gradient: true },
  shadow: { id: 'shadow', name: 'Sombra', color: '#1f2937', price: 300, emoji: '🖤' },
}

export const MAP_THEMES = {
  space: { id: 'space', name: 'Espaco', emoji: '🚀', price: 0, bgTop: '#0f0a1e', bgMid: '#1a1035', bgBottom: '#0d0820', obstacleBase: 'hsl(265 50% 25%)', obstacleLight: 'hsl(265 50% 35%)', obstacleCap: 'hsl(265 60% 45%)', stars: true },
  forest: { id: 'forest', name: 'Floresta', emoji: '🌲', price: 150, bgTop: '#0a1a0a', bgMid: '#0f2a0f', bgBottom: '#081508', obstacleBase: 'hsl(120 40% 18%)', obstacleLight: 'hsl(120 40% 28%)', obstacleCap: 'hsl(120 50% 38%)', stars: false },
  desert: { id: 'desert', name: 'Deserto', emoji: '🏜️', price: 150, bgTop: '#1a0f00', bgMid: '#2a1800', bgBottom: '#150c00', obstacleBase: 'hsl(30 50% 22%)', obstacleLight: 'hsl(30 50% 32%)', obstacleCap: 'hsl(30 60% 42%)', stars: false },
  snow: { id: 'snow', name: 'Neve', emoji: '❄️', price: 150, bgTop: '#0a0f1f', bgMid: '#0d1530', bgBottom: '#080c1a', obstacleBase: 'hsl(210 50% 20%)', obstacleLight: 'hsl(210 50% 30%)', obstacleCap: 'hsl(210 60% 50%)', stars: true },
  cyber: { id: 'cyber', name: 'Cyber', emoji: '🤖', price: 300, bgTop: '#000a0f', bgMid: '#001520', bgBottom: '#000810', obstacleBase: 'hsl(185 50% 10%)', obstacleLight: 'hsl(185 50% 20%)', obstacleCap: 'hsl(185 80% 40%)', stars: false },
  volcano: { id: 'volcano', name: 'Vulcao', emoji: '🌋', price: 300, bgTop: '#1a0000', bgMid: '#2a0500', bgBottom: '#150000', obstacleBase: 'hsl(0 50% 18%)', obstacleLight: 'hsl(0 50% 28%)', obstacleCap: 'hsl(0 70% 45%)', stars: false },
}

export const SHOP_ITEMS = {
  extra_lives_3: { id: 'extra_lives_3', name: '3 Vidas Extras', price: 50, emoji: '❤️', description: '+3 vidas' },
  extra_lives_10: { id: 'extra_lives_10', name: '10 Vidas Extras', price: 150, emoji: '💖', description: '+10 vidas' },
  coin_pack_small: { id: 'coin_pack_small', name: '50 Moedas', price: 0, emoji: '🪙', description: 'Assista um anuncio', isAdReward: true },
}

export const IAP_PRODUCTS = {
  remove_ads: { id: 'remove_ads', name: 'Remover Anuncios', priceLabel: 'R$ 4,99' },
}

export const GAME = {
  BALL_RADIUS: 18,
  GRAVITY: 0.35,
  BOUNCE_FORCE: -8.5,
  OBSTACLE_WIDTH: 60,
  OBSTACLE_GAP: 160,
  OBSTACLE_SPEED_BASE: 2.5,
  COIN_RADIUS: 12,
  GAMES_BETWEEN_ADS: 3,
}

export const DIFFICULTY_LEVELS = [
  { score: 0, speed: 1, gapMultiplier: 1, label: 'Facil' },
  { score: 10, speed: 1.2, gapMultiplier: 0.95, label: 'Normal' },
  { score: 25, speed: 1.4, gapMultiplier: 0.9, label: 'Dificil' },
  { score: 50, speed: 1.7, gapMultiplier: 0.85, label: 'Muito Dificil' },
  { score: 80, speed: 2, gapMultiplier: 0.8, label: 'Insano' },
  { score: 120, speed: 2.4, gapMultiplier: 0.75, label: 'Impossivel' },
]

export function getDifficulty(score) {
  let level = DIFFICULTY_LEVELS[0]
  for (const candidate of DIFFICULTY_LEVELS) {
    if (score >= candidate.score) {
      level = candidate
    }
  }

  return level
}
