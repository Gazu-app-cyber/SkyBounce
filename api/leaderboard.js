import { getWeekKey, hasRedis, json, leaderboardKey, metaKey, redis } from './_lib/redis.js'

async function readScope(scope, playerId) {
  const raw = await redis(['ZREVRANGE', leaderboardKey(scope), 0, 24, 'WITHSCORES'])
  const pairs = []

  for (let index = 0; index < raw.length; index += 2) {
    pairs.push({
      playerId: raw[index],
      score: Number(raw[index + 1] ?? 0),
    })
  }

  const entries = await Promise.all(
    pairs.map(async (pair, index) => {
      const metaRaw = await redis(['GET', metaKey(scope, pair.playerId)])
      const meta = metaRaw ? JSON.parse(metaRaw) : {
        playerId: pair.playerId,
        name: 'Player',
        score: pair.score,
        survivalMs: 0,
        createdAt: Date.now(),
      }

      return {
        rank: index + 1,
        id: `${scope}-${pair.playerId}`,
        ...meta,
        score: pair.score,
      }
    }),
  )

  const rank = playerId ? await redis(['ZREVRANK', leaderboardKey(scope), playerId]) : null
  return {
    entries,
    playerRank: rank === null ? null : Number(rank) + 1,
    mode: 'remote',
  }
}

export async function GET(request) {
  if (!hasRedis()) {
    return json({ ok: false, error: 'redis_not_configured' }, 503)
  }

  const url = new URL(request.url)
  const scopeParam = url.searchParams.get('scope') ?? 'global'
  const playerId = url.searchParams.get('playerId')
  const scope = scopeParam === 'weekly' ? getWeekKey(Date.now()) : 'global'

  return json(await readScope(scope, playerId))
}
