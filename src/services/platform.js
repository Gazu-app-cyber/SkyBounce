import { saveJson, loadJson } from './storage'

const PURCHASE_KEY = 'skybounce.purchases.v1'
const SANDBOX_DELAY = 1200

function readPurchases() {
  return loadJson(PURCHASE_KEY, {
    remove_ads: false,
    coin_pack_small: 0,
    revive_pack_iap: 0,
  })
}

function writePurchases(purchases) {
  saveJson(PURCHASE_KEY, purchases)
}

function getNativeBridge() {
  if (window.Capacitor?.Plugins?.SkyBouncePurchases) {
    return {
      kind: 'capacitor',
      bridge: window.Capacitor.Plugins.SkyBouncePurchases,
    }
  }

  if (window.__skybounceNativePurchases) {
    return {
      kind: 'custom',
      bridge: window.__skybounceNativePurchases,
    }
  }

  return null
}

export async function restorePurchases() {
  const native = getNativeBridge()

  if (native?.bridge?.restorePurchases) {
    const restored = await native.bridge.restorePurchases()
    return {
      removeAds: Boolean(restored?.removeAds),
      coins: Number(restored?.coins ?? 0),
      revives: Number(restored?.revives ?? 0),
      provider: native.kind,
    }
  }

  const local = readPurchases()
  return {
    removeAds: Boolean(local.remove_ads),
    coins: Number(local.coin_pack_small ?? 0),
    revives: Number(local.revive_pack_iap ?? 0),
    provider: 'sandbox-web',
  }
}

export async function purchaseProduct(productId) {
  const native = getNativeBridge()
  if (native?.bridge?.purchaseProduct) {
    return native.bridge.purchaseProduct({ productId })
  }

  await new Promise((resolve) => window.setTimeout(resolve, SANDBOX_DELAY))
  const purchases = readPurchases()

  if (productId === 'remove_ads') {
    purchases.remove_ads = true
  }

  if (productId === 'coin_pack_small') {
    purchases.coin_pack_small += 500
  }

  if (productId === 'revive_pack_iap') {
    purchases.revive_pack_iap += 5
  }

  writePurchases(purchases)
  return { ok: true, provider: 'sandbox-web' }
}

export async function showRewardedAd() {
  const native = getNativeBridge()
  if (native?.bridge?.showRewardedAd) {
    return native.bridge.showRewardedAd()
  }

  await new Promise((resolve) => window.setTimeout(resolve, 1800))
  return { rewarded: true, provider: 'sandbox-web' }
}

export async function showInterstitialAd() {
  const native = getNativeBridge()
  if (native?.bridge?.showInterstitialAd) {
    return native.bridge.showInterstitialAd()
  }

  await new Promise((resolve) => window.setTimeout(resolve, 1100))
  return { shown: true, provider: 'sandbox-web' }
}
