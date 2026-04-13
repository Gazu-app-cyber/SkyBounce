import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createCheckoutSession,
  getLeaderboard,
  getProfile,
  postRun,
  removeProfile,
  saveProfile,
  verifyCheckoutSession,
} from '../api/gameApi'
import { getPurchases, loadCachedProfile, saveCachedProfile, savePurchases, clearCachedProfile } from '../lib/storage'

function defaultProfile(session) {
  return {
    playerId: session.playerId,
    name: session.displayName || 'Jogador',
    coins: 0,
    revives: 0,
    bestScore: 0,
    bestTimeMs: 0,
    totalRuns: 0,
    totalScore: 0,
    totalPlayMs: 0,
    adFree: false,
    ownedSkins: ['default'],
    selectedSkin: 'default',
    ownedMaps: ['space'],
    selectedMap: 'space',
    lastPlayedAt: null,
    settings: {
      sfxVolume: 0.7,
      musicVolume: 0.45,
    },
  }
}

export default function usePlayerProfile(session) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteState, setDeleteState] = useState({ loading: false, success: false })
  const profileRef = useRef(null)

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      const cached = loadCachedProfile()
      const fallback = cached?.playerId === session.playerId ? cached : defaultProfile(session)
      if (!cancelled) {
        setProfile(fallback)
        profileRef.current = fallback
      }

      try {
        const remote = await getProfile(session.playerId)
        const purchases = getPurchases()
        const next = remote
          ? {
              ...fallback,
              ...remote,
              adFree: remote.adFree || purchases.remove_ads,
            }
          : {
              ...fallback,
              adFree: fallback.adFree || purchases.remove_ads,
            }

        if (!cancelled) {
          setProfile(next)
          profileRef.current = next
          saveCachedProfile(next)
          if (!remote) {
            await saveProfile(next)
          }
        }
      } catch {
        if (!cancelled) {
          setError('Usando dados locais no momento.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [session])

  const updateProfile = useCallback(async (partial) => {
    if (!profileRef.current) {
      return null
    }

    const previous = profileRef.current
    const optimistic = {
      ...previous,
      ...partial,
      settings: {
        ...previous.settings,
        ...(partial.settings ?? {}),
      },
    }

    setProfile(optimistic)
    profileRef.current = optimistic
    saveCachedProfile(optimistic)

    try {
      const saved = await saveProfile(optimistic)
      setProfile(saved)
      profileRef.current = saved
      saveCachedProfile(saved)
      return saved
    } catch {
      setProfile(previous)
      profileRef.current = previous
      saveCachedProfile(previous)
      setError('Erro ao salvar. Tentando novamente ajuda.')
      throw new Error('save_failed')
    }
  }, [])

  const submitRun = useCallback(async (run) => {
    if (!profileRef.current) {
      return null
    }

    await postRun(run).catch(() => null)
    return getLeaderboard('global', profileRef.current.playerId).catch(() => null)
  }, [])

  const completeRealPurchase = useCallback(async (productId) => {
    const purchases = getPurchases()
    if (productId === 'remove_ads') {
      purchases.remove_ads = true
    }
    savePurchases(purchases)
    return updateProfile({ adFree: true })
  }, [updateProfile])

  const startCheckout = useCallback(async (productId) => {
    if (!profileRef.current) {
      throw new Error('missing_profile')
    }

    const response = await createCheckoutSession({
      playerId: profileRef.current.playerId,
      name: profileRef.current.name,
      productId,
    })

    if (response.alreadyOwned) {
      return completeRealPurchase(productId)
    }

    return response
  }, [completeRealPurchase])

  const verifyPurchase = useCallback(async (sessionId) => {
    if (!profileRef.current) {
      throw new Error('missing_profile')
    }

    const response = await verifyCheckoutSession({
      sessionId,
      playerId: profileRef.current.playerId,
    })

    if (response.ok && response.productId === 'remove_ads') {
      return completeRealPurchase('remove_ads')
    }

    throw new Error('purchase_not_verified')
  }, [completeRealPurchase])

  const deleteAccount = useCallback(async () => {
    if (!profileRef.current) {
      return
    }

    setDeleteState({ loading: true, success: false })
    try {
      await removeProfile(profileRef.current.playerId)
      clearCachedProfile()
      setDeleteState({ loading: false, success: true })
      setProfile(null)
      profileRef.current = null
    } catch {
      setDeleteState({ loading: false, success: false })
      setError('Nao foi possivel excluir a conta agora.')
    }
  }, [])

  return {
    profile,
    loading,
    error,
    deleteState,
    updateProfile,
    submitRun,
    completeRealPurchase,
    startCheckout,
    verifyPurchase,
    deleteAccount,
  }
}
