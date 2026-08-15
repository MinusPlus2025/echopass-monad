export interface RateLimiter {
  allow(key: string): boolean
}

interface RateLimitOptions {
  limit: number
  now?: () => number
  windowMs: number
}

export function createRateLimiter({
  limit,
  now = Date.now,
  windowMs,
}: RateLimitOptions): RateLimiter {
  const attempts = new Map<string, number[]>()

  return {
    allow(key) {
      const current = now()
      const active = (attempts.get(key) ?? []).filter(
        (timestamp) => current - timestamp < windowMs,
      )
      if (active.length >= limit) {
        attempts.set(key, active)
        return false
      }
      active.push(current)
      attempts.set(key, active)
      return true
    },
  }
}
