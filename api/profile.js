import {
  getWeekKey,
  hasRedis,
  json,
  leaderboardKey,
  metaKey,
  profileKey,
  redis,
} from './_lib/redis.js'

function sanitizeProfile(payload) {
  return {
    playerId: String(payload.playerId ?? ''),
    name: String(payload.name ?? 'Player'),
    coins: Number(payload.coins ?? 0),
    revives: Number(payload.revives ?? 0),
    bestScore: Number(payload.bestScore ?? 0),
    bestTimeMs: Number(payload.bestTimeMs ?? 0),
    totalRuns: Number(payload.totalRuns ?? 0),
    totalScore: Number(payload.totalScore ?? 0),
    totalPlayMs: Number(payload.totalPlayMs ?? 0),
    adFree: Boolean(payload.adFree),
    ownedSkins: Array.isArray(payload.ownedSkins) ? payload.ownedSkins : ['forest'],
    selectedSkin: String(payload.selectedSkin ?? 'forest'),
    lastPlayedAt: payload.lastPlayedAt ?? null,
    settings: {
      sfxVolume: Number(payload.settings?.sfxVolume ?? 0.7),
      musicVolume: Number(payload.settings?.musicVolume ?? 0.45),
    },
  }
}

function leaderboardMeta(profile) {
  return {
    playerId: profile.playerId,
    name: profile.name,
    score: profile.bestScore,
    survivalMs: profile.bestTimeMs,
    skin: profile.selectedSkin,
    createdAt: profile.lastPlayedAt ?? Date.now(),
  }
}

export async function GET(request) {
  if (!hasRedis()) {
    return json({ ok: false, error: 'redis_not_configured' }, 503)
  }

  const playerId = new URL(request.url).searchParams.get('playerId')
  if (!playerId) {
    return json({ ok: false, error: 'playerId_required' }, 400)
  }

  const raw = await redis(['GET', profileKey(playerId)])
  return json({
    ok: true,
    profile: raw ? JSON.parse(raw) : null,
  })
}

export async function PUT(request) {
  if (!hasRedis()) {
    return json({ ok: false, error: 'redis_not_configured' }, 503)
  }

  const incoming = sanitizeProfile(await request.json())
  if (!incoming.playerId) {
    return json({ ok: false, error: 'playerId_required' }, 400)
  }

  await redis(['SET', profileKey(incoming.playerId), JSON.stringify(incoming)])

  if (incoming.bestScore > 0) {
    const week = getWeekKey(Date.now())
    const meta = leaderboardMeta(incoming)

    await Promise.all([
      redis(['ZADD', leaderboardKey('global'), incoming.bestScore, incoming.playerId]),
      redis(['SET', metaKey('global', incoming.playerId), JSON.stringify(meta)]),
      redis(['ZADD', leaderboardKey(week), incoming.bestScore, incoming.playerId]),
      redis(['SET', metaKey(week, incoming.playerId), JSON.stringify(meta)]),
    ])
  }

  return json({ ok: true, profile: incoming, mode: 'remote' })
}

export async function DELETE(request) {
  if (!hasRedis()) {
    return json({ ok: false, error: 'redis_not_configured' }, 503)
  }

  const playerId = new URL(request.url).searchParams.get('playerId')
  if (!playerId) {
    return json({ ok: false, error: 'playerId_required' }, 400)
  }

  const week = getWeekKey(Date.now())
  await Promise.all([
    redis(['DEL', profileKey(playerId)]),
    redis(['ZREM', leaderboardKey('global'), playerId]),
    redis(['DEL', metaKey('global', playerId)]),
    redis(['ZREM', leaderboardKey(week), playerId]),
    redis(['DEL', metaKey(week, playerId)]),
  ])

  return json({ ok: true })
}
