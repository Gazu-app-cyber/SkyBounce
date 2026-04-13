const STORAGE_KEYS = {
  profile: 'skybounce.profile.v2',
  leaderboard: 'skybounce.leaderboard.v2',
  seeds: 'skybounce.seeded.v1',
}

export function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeKey(key) {
  localStorage.removeItem(key)
}

export function storageKeys() {
  return STORAGE_KEYS
}
