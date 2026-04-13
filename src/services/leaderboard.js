import { loadJson, removeKey, saveJson, storageKeys } from './storage'

const API_URL = import.meta.env.VITE_SKYBOUNCE_API_URL || '/api'
const API_TOKEN = import.meta.env.VITE_SKYBOUNCE_API_TOKEN

const BOT_NAMES = ['Astra', 'Bolt', 'Kite', 'Nina', 'Pixel', 'Rook', 'Tico', 'Vega', 'Zuri', 'Luma']

function headers() {
  return {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers(),
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json()
}

function getLeaderboardStore() {
  return loadJson(storageKeys().leaderboard, [])
}

function setLeaderboardStore(entries) {
  saveJson(storageKeys().leaderboard, entries)
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }

    return b.survivalMs - a.survivalMs
  })
}

export function getWeekKey(timestamp) {
  const date = new Date(timestamp)
  const firstDay = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date - firstDay) / 86400000)
  return `${date.getFullYear()}-W${Math.ceil((days + firstDay.getDay() + 1) / 7)}`
}

function seedLocalLeaderboard(playerName) {
  const seeded = loadJson(storageKeys().seeds, false)
  if (seeded) {
    return
  }

  const now = Date.now()
  const entries = BOT_NAMES.map((name, index) => ({
    id: `bot-${index}`,
    playerId: `bot-${index}`,
    name,
    score: 8 + Math.floor(Math.random() * 55),
    survivalMs: 25000 + Math.floor(Math.random() * 90000),
    createdAt: now - index * 86400000,
    weekKey: getWeekKey(now),
    checksum: `bot-${index}`,
  }))

  if (playerName) {
    entries.push({
      id: 'local-player-seed',
      playerId: 'local-player-seed',
      name: playerName,
      score: 0,
      survivalMs: 0,
      createdAt: now,
      weekKey: getWeekKey(now),
      checksum: 'seed',
    })
  }

  setLeaderboardStore(entries)
  saveJson(storageKeys().seeds, true)
}

export function buildRunChecksum(payload) {
  const raw = [
    payload.playerId,
    payload.score,
    payload.survivalMs,
    payload.tapCount,
    payload.maxSpeed,
    payload.sessionStartedAt,
  ].join('|')

  return btoa(raw).replaceAll('=', '')
}

function localLeaderboard({ scope = 'global', playerId, playerName }) {
  seedLocalLeaderboard(playerName)
  const entries = getLeaderboardStore()
  const filtered = scope === 'weekly'
    ? entries.filter((entry) => entry.weekKey === getWeekKey(Date.now()))
    : entries
  const sorted = sortEntries(filtered)
  const playerIndex = sorted.findIndex((entry) => entry.playerId === playerId)

  return {
    entries: sorted.slice(0, 25).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    })),
    playerRank: playerIndex >= 0 ? playerIndex + 1 : null,
    mode: 'local',
  }
}

export async function submitScore(run) {
  try {
    return await api('/leaderboard/runs', {
      method: 'POST',
      body: JSON.stringify(run),
    })
  } catch {
    const entries = getLeaderboardStore()
    entries.push({
      ...run,
      id: `${run.playerId}-${run.createdAt}`,
      weekKey: getWeekKey(run.createdAt),
    })
    setLeaderboardStore(entries)
    return { ok: true, mode: 'local' }
  }
}

export async function fetchLeaderboard({ scope = 'global', playerId, playerName }) {
  try {
    return await api(`/leaderboard?scope=${scope}&playerId=${playerId}`)
  } catch {
    return localLeaderboard({ scope, playerId, playerName })
  }
}

export async function loadRemoteProfile(playerId) {
  try {
    const result = await api(`/profile?playerId=${encodeURIComponent(playerId)}`)
    return result.profile ?? null
  } catch {
    return null
  }
}

export async function syncProfile(profile) {
  try {
    return await api('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    })
  } catch {
    return { ok: true, profile, mode: 'local' }
  }
}

export async function deleteAccountData(playerId) {
  try {
    return await api(`/profile?playerId=${encodeURIComponent(playerId)}`, {
      method: 'DELETE',
    })
  } catch {
    removeKey(storageKeys().profile)
    removeKey(storageKeys().leaderboard)
    removeKey(storageKeys().seeds)
    return { ok: true, mode: 'local' }
  }
}
