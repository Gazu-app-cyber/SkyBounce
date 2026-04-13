import { hasRedis, json, profileKey, redis } from '../_lib/redis.js'
import { getStripe, hasStripe } from '../_lib/stripe.js'

export async function POST(request) {
  if (!hasStripe()) {
    return json({ ok: false, error: 'stripe_not_configured' }, 503)
  }

  if (!hasRedis()) {
    return json({ ok: false, error: 'redis_not_configured' }, 503)
  }

  const body = await request.json()
  const sessionId = String(body.sessionId ?? '')
  const playerId = String(body.playerId ?? '')

  if (!sessionId || !playerId) {
    return json({ ok: false, error: 'session_id_and_player_id_required' }, 400)
  }

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (!session || session.metadata?.playerId !== playerId) {
    return json({ ok: false, error: 'checkout_session_mismatch' }, 400)
  }

  if (session.payment_status !== 'paid' || session.status !== 'complete') {
    return json({ ok: false, error: 'payment_not_completed' }, 400)
  }

  const profileRaw = await redis(['GET', profileKey(playerId)])
  if (!profileRaw) {
    return json({ ok: false, error: 'profile_not_found' }, 404)
  }

  const profile = JSON.parse(profileRaw)
  profile.adFree = true
  await redis(['SET', profileKey(playerId), JSON.stringify(profile)])

  return json({
    ok: true,
    productId: session.metadata?.productId ?? 'remove_ads',
    profile,
  })
}
