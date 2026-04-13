import Stripe from 'stripe'

const STRIPE_API_VERSION = '2026-02-25.clover'

let stripeClient = null

export function hasStripe() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripe() {
  if (!hasStripe()) {
    throw new Error('stripe_not_configured')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
    })
  }

  return stripeClient
}

export function getBaseUrl(request) {
  const origin = request.headers.get('origin')
  if (origin) {
    return origin
  }

  if (process.env.VITE_APP_URL) {
    return process.env.VITE_APP_URL
  }

  return 'http://localhost:5173'
}

export function getRemoveAdsPriceBrl() {
  const price = Number(process.env.STRIPE_REMOVE_ADS_PRICE_BRL ?? 499)
  return Number.isFinite(price) && price > 0 ? Math.round(price) : 499
}
