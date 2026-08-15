export const CODE_WINDOW_MS = 30_000

export const timeSlot = (nowMs: number, windowMs = CODE_WINDOW_MS): number =>
  Math.floor(nowMs / windowMs)

export async function deriveCode(
  eventId: string,
  secret: string,
  slot: number,
): Promise<string> {
  const message = new TextEncoder().encode(`${eventId}:${secret}:${slot}`)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', message)
  const bytes = new Uint8Array(digest)
  const value =
    ((bytes[0] << 24) |
      (bytes[1] << 16) |
      (bytes[2] << 8) |
      bytes[3]) >>> 0

  return String(value % 1_000_000).padStart(6, '0')
}

export async function acceptedCodes(
  eventId: string,
  secret: string,
  nowMs: number,
): Promise<string[]> {
  const slot = timeSlot(nowMs)
  return Promise.all([
    deriveCode(eventId, secret, slot),
    deriveCode(eventId, secret, slot - 1),
  ])
}
