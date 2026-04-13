const KEYS = {
  session: 'skybounce.session.v1',
  profile: 'skybounce.profile.v3',
  purchases: 'skybounce.purchases.v1',
}

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeValue(key) {
  localStorage.removeItem(key)
}

export function loadSession() {
  return readJson(KEYS.session, null)
}

export function saveSession(session) {
  writeJson(KEYS.session, session)
}

export function clearSession() {
  removeValue(KEYS.session)
}

export function loadCachedProfile() {
  return readJson(KEYS.profile, null)
}

export function saveCachedProfile(profile) {
  writeJson(KEYS.profile, profile)
}

export function clearCachedProfile() {
  removeValue(KEYS.profile)
}

export function getPurchases() {
  return readJson(KEYS.purchases, {
    remove_ads: false,
    coin_pack_small: 0,
    revive_pack_iap: 0,
  })
}

export function savePurchases(purchases) {
  writeJson(KEYS.purchases, purchases)
}
