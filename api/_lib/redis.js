const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

export function hasRedis() {
  return Boolean(REDIS_URL && REDIS_TOKEN)
}

export function json(data, status = 200) {
  return Response.json(data, { status })
}

export async function redis(command) {
  const response = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })

  if (!response.ok) {
    throw new Error(`Redis HTTP ${response.status}`)
  }

  const payload = await response.json()
  return payload.result
}

export function getWeekKey(timestamp = Date.now()) {
  const date = new Date(timestamp)
  const firstDay = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date - firstDay) / 86400000)
  return `${date.getFullYear()}-W${Math.ceil((days + firstDay.getDay() + 1) / 7)}`
}

export function profileKey(playerId) {
  return `skybounce:profile:${playerId}`
}

export function leaderboardKey(scope) {
  return `skybounce:leaderboard:${scope}`
}

export function metaKey(scope, playerId) {
  return `skybounce:leaderboard:${scope}:meta:${playerId}`
}
