// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

import { deriveCode, timeSlot } from '../src/domain/code.js'
import { createChallengeHandler } from '../api/challenge.js'

const nowMs = 1_800_000_000_000
const eventId = `0x${'22'.repeat(32)}`

describe('protected Host challenge endpoint', () => {
  it('rejects a missing host token without returning a code', async () => {
    const response = responseFixture()
    await createChallengeHandler({
      env: {
        ECHOPASS_EVENT_ID: eventId,
        EVENT_CODE_SECRET: 'server-only-event-secret',
        HOST_ACCESS_TOKEN: 'host-access-token-value',
      },
      nowMs: () => nowMs,
    })({ headers: {}, method: 'GET' }, response)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({ error: 'unauthorized' })
  })

  it('returns the current code and exact slot expiry to an authorized Host', async () => {
    const response = responseFixture()
    await createChallengeHandler({
      env: {
        ECHOPASS_EVENT_ID: eventId,
        EVENT_CODE_SECRET: 'server-only-event-secret',
        HOST_ACCESS_TOKEN: 'host-access-token-value',
      },
      nowMs: () => nowMs,
    })(
      {
        headers: { 'x-host-token': 'host-access-token-value' },
        method: 'GET',
      },
      response,
    )

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({
      code: await deriveCode(
        eventId,
        'server-only-event-secret',
        timeSlot(nowMs),
      ),
      expiresAt: 1_800_000_030_000,
    })
  })
})

function responseFixture() {
  const response = { json: vi.fn(), setHeader: vi.fn(), status: vi.fn() }
  response.status.mockReturnValue(response)
  return response
}
