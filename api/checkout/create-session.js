import { hasRedis, json, profileKey, redis } from '../_lib/redis.js'
import { getBaseUrl, getRemoveAdsPriceBrl, getStripe, hasStripe } from '../_lib/stripe.js'

export async function POST(request) {
  if (!hasStripe()) {
    return json({ ok: false, error: 'stripe_not_configured' }, 503)
  }

  if (!hasRedis()) {
    return json({ ok: false, error: 'redis_not_configured' }, 503)
  }

  const body = await request.json()
  const playerId = String(body.playerId ?? '')
  const name = String(body.name ?? 'Jogador')
  const productId = String(body.productId ?? '')

  if (!playerId || productId !== 'remove_ads') {
    return json({ ok: false, error: 'invalid_checkout_request' }, 400)
  }

  const profileRaw = await redis(['GET', profileKey(playerId)])
  if (!profileRaw) {
    return json({ ok: false, error: 'profile_not_found' }, 404)
  }

  const profile = JSON.parse(profileRaw)
  if (profile.adFree) {
    return json({ ok: true, alreadyOwned: true })
  }

  const stripe = getStripe()
  const baseUrl = getBaseUrl(request)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${baseUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?checkout=cancelled`,
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'SkyBounce - Remover Anuncios',
            description: 'Compra unica para remover anuncios da versao web.',
          },
          unit_amount: getRemoveAdsPriceBrl(),
        },
        quantity: 1,
      },
    ],
    metadata: {
      playerId,
      productId,
      playerName: name,
    },
    client_reference_id: playerId,
  })

  return json({
    ok: true,
    checkoutUrl: session.url,
    sessionId: session.id,
  })
}
