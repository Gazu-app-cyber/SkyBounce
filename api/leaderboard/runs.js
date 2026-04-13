import {
  getWeekKey,
  hasRedis,
  json,
  leaderboardKey,
  metaKey,
  profileKey,
  redis,
} from '../_lib/redis.js'

function isValidRun(run) {
  if (!run?.playerId || !run?.name) {
    return false
  }

  if (!Number.isFinite(run.score) || !Number.isFinite(run.survivalMs)) {
    return false
  }

  if (run.score < 0 || run.survivalMs < 0) {
    return false
  }

  const maxByTime = Math.floor(run.survivalMs / 320) + 12
  const maxByTaps = Math.floor((run.tapCount ?? 0) * 1.4) + 8
  return run.score <= Math.max(maxByTime, maxByTaps)
}

async function upsertScope(scope, run) {
  const current = await redis(['ZSCORE', leaderboardKey(scope), run.playerId])
  const currentScore = current === null ? -1 : Number(current)

  if (run.score < currentScore) {
    return
  }

  await redis(['ZADD', leaderboardKey(scope), run.score, run.playerId])
  await redis(['SET', metaKey(scope, run.playerId), JSON.stringify({
    playerId: run.playerId,
    name: run.name,
    score: run.score,
    survivalMs: run.survivalMs,
    skin: run.skin ?? 'forest',
    createdAt: run.createdAt,
  })])
}

export async function POST(request) {
  if (!hasRedis()) {
    return json({ ok: false, error: 'redis_not_configured' }, 503)
  }

  const run = await request.json()
  if (!isValidRun(run)) {
    return json({ ok: false, error: 'invalid_run' }, 400)
  }

  const weeklyScope = getWeekKey(run.createdAt ?? Date.now())
  await Promise.all([
    upsertScope('global', run),
    upsertScope(weeklyScope, run),
  ])

  const profileRaw = await redis(['GET', profileKey(run.playerId)])
  if (profileRaw) {
    const profile = JSON.parse(profileRaw)
    if (run.score > Number(profile.bestScore ?? 0)) {
      profile.bestScore = run.score
      profile.bestTimeMs = Math.max(Number(profile.bestTimeMs ?? 0), Number(run.survivalMs ?? 0))
      profile.lastPlayedAt = run.createdAt ?? Date.now()
      await redis(['SET', profileKey(run.playerId), JSON.stringify(profile)])
    }
  }

  return json({ ok: true, mode: 'remote' })
}
