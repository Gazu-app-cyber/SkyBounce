import { hasRedis, json } from './_lib/redis.js'

export async function GET() {
  return json({
    ok: true,
    backend: 'vercel-functions',
    redisConfigured: hasRedis(),
  })
}
