import { useEffect, useState } from 'react'
import { MAP_SKINS } from '../gameData'
import { deleteAccountData, syncProfile } from '../services/leaderboard'
import { purchaseProduct, restorePurchases } from '../services/platform'
import { loadJson, saveJson, storageKeys } from '../services/storage'

function randomName() {
  return `Player-${Math.floor(1000 + Math.random() * 9000)}`
}

function defaultProfile() {
  return {
    playerId: crypto.randomUUID(),
    name: randomName(),
    coins: 120,
    revives: 1,
    bestScore: 0,
    bestTimeMs: 0,
    totalRuns: 0,
    totalScore: 0,
    totalPlayMs: 0,
    adFree: false,
    ownedSkins: ['forest'],
    selectedSkin: 'forest',
    lastPlayedAt: null,
    settings: {
      sfxVolume: 0.7,
      musicVolume: 0.45,
    },
  }
}

export function usePlayerProfile() {
  const [profile, setProfile] = useState(() => loadJson(storageKeys().profile, defaultProfile()))
  const [purchasePending, setPurchasePending] = useState(false)
  const [error, setError] = useState('')
  const [deleteState, setDeleteState] = useState({ loading: false, success: false })

  useEffect(() => {
    saveJson(storageKeys().profile, profile)
  }, [profile])

  useEffect(() => {
    let cancelled = false

    restorePurchases()
      .then((restored) => {
        if (cancelled) {
          return
        }

        setProfile((current) => ({
          ...current,
          adFree: current.adFree || restored.removeAds,
          coins: current.coins + restored.coins,
          revives: current.revives + restored.revives,
        }))
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  async function persist(next) {
    setProfile(next)
    saveJson(storageKeys().profile, next)
    await syncProfile(next)
  }

  async function updateName(name) {
    const next = { ...profile, name: name.trim() || profile.name }
    await persist(next)
  }

  async function updateVolumes(key, value) {
    const next = {
      ...profile,
      settings: {
        ...profile.settings,
        [key]: value,
      },
    }
    await persist(next)
  }

  async function recordRun({ score, survivalMs, coinsEarned }) {
    const unlockedSkins = MAP_SKINS.filter(
      (skin) => skin.unlockType === 'score' && score >= skin.unlockValue,
    ).map((skin) => skin.id)

    const ownedSet = new Set([...profile.ownedSkins, ...unlockedSkins])
    const next = {
      ...profile,
      coins: profile.coins + coinsEarned,
      bestScore: Math.max(profile.bestScore, score),
      bestTimeMs: Math.max(profile.bestTimeMs, survivalMs),
      totalRuns: profile.totalRuns + 1,
      totalScore: profile.totalScore + score,
      totalPlayMs: profile.totalPlayMs + survivalMs,
      lastPlayedAt: Date.now(),
      ownedSkins: [...ownedSet],
    }

    await persist(next)
    return next
  }

  async function buySkin(skinId) {
    const skin = MAP_SKINS.find((entry) => entry.id === skinId)
    if (!skin || skin.unlockType !== 'coins' || profile.ownedSkins.includes(skinId)) {
      return
    }

    if (profile.coins < skin.unlockValue) {
      setError('Moedas insuficientes para desbloquear esta skin.')
      return
    }

    setError('')
    const optimistic = {
      ...profile,
      coins: profile.coins - skin.unlockValue,
      ownedSkins: [...profile.ownedSkins, skinId],
    }
    setProfile(optimistic)

    try {
      await syncProfile(optimistic)
      saveJson(storageKeys().profile, optimistic)
    } catch {
      setProfile(profile)
      setError('A compra falhou. O estado foi restaurado.')
    }
  }

  async function spendCoins(amount, apply) {
    if (profile.coins < amount) {
      setError('Moedas insuficientes.')
      return false
    }

    setError('')
    const optimistic = apply({
      ...profile,
      coins: profile.coins - amount,
    })
    setProfile(optimistic)

    try {
      await syncProfile(optimistic)
      saveJson(storageKeys().profile, optimistic)
      return true
    } catch {
      setProfile(profile)
      setError('Nao foi possivel concluir a compra. O estado foi revertido.')
      return false
    }
  }

  async function buyRevivesWithCoins() {
    return spendCoins(180, (draft) => ({
      ...draft,
      revives: draft.revives + 3,
    }))
  }

  async function purchaseRealMoney(productId) {
    setPurchasePending(true)
    setError('')

    try {
      await purchaseProduct(productId)
      const next = { ...profile }

      if (productId === 'remove_ads') {
        next.adFree = true
      }

      if (productId === 'coin_pack_small') {
        next.coins += 500
      }

      if (productId === 'revive_pack_iap') {
        next.revives += 5
      }

      await persist(next)
    } catch {
      setError('A compra nao foi concluida.')
    } finally {
      setPurchasePending(false)
    }
  }

  async function consumeRevive() {
    if (profile.revives <= 0) {
      return false
    }

    const next = {
      ...profile,
      revives: profile.revives - 1,
    }
    await persist(next)
    return true
  }

  async function selectSkin(skinId) {
    if (!profile.ownedSkins.includes(skinId)) {
      return
    }

    const next = {
      ...profile,
      selectedSkin: skinId,
    }
    await persist(next)
  }

  async function deleteAccount() {
    setDeleteState({ loading: true, success: false })
    setError('')

    try {
      await deleteAccountData(profile.playerId)
      const reset = defaultProfile()
      saveJson(storageKeys().profile, reset)
      setProfile(reset)
      setDeleteState({ loading: false, success: true })
    } catch {
      setDeleteState({ loading: false, success: false })
      setError('Nao foi possivel excluir a conta agora.')
    }
  }

  return {
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
  }
}
