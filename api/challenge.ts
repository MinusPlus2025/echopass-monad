import { timingSafeEqual } from 'node:crypto'

import { isHexString } from 'ethers'

import { CODE_WINDOW_MS, deriveCode, timeSlot } from '../src/domain/code.js'

interface ChallengeRequest {
  headers: Record<string, string | string[] | undefined>
  method?: string
}

interface ChallengeResponse {
  json(body: unknown): void
  setHeader(name: string, value: string): void
  status(code: number): ChallengeResponse
}

interface ChallengeOptions {
  env: Record<string, string | undefined>
  nowMs: () => number
}

function equalToken(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual)
  const expectedBytes = Buffer.from(expected)
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  )
}

export function createChallengeHandler(options: ChallengeOptions) {
  return async (
    request: ChallengeRequest,
    response: ChallengeResponse,
  ): Promise<void> => {
    response.setHeader('Cache-Control', 'no-store')
    if (request.method !== 'GET') {
      response.status(405).json({ error: 'method_not_allowed' })
      return
    }

    const expectedToken = options.env.HOST_ACCESS_TOKEN
    const eventSecret = options.env.EVENT_CODE_SECRET
    const eventId = options.env.ECHOPASS_EVENT_ID
    const header = request.headers['x-host-token']
    const token = Array.isArray(header) ? header[0] : header
    if (!expectedToken || !token || !equalToken(token, expectedToken)) {
      response.status(401).json({ error: 'unauthorized' })
      return
    }
    if (!eventSecret || !eventId || !isHexString(eventId, 32)) {
      response.status(500).json({ error: 'server_configuration_error' })
      return
    }

    const now = options.nowMs()
    const slot = timeSlot(now)
    response.status(200).json({
      code: await deriveCode(eventId, eventSecret, slot),
      expiresAt: (slot + 1) * CODE_WINDOW_MS,
    })
  }
}

export default createChallengeHandler({ env: process.env, nowMs: Date.now })
