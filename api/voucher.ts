import { Wallet } from 'ethers'

import { loadServerConfig } from './lib/config.js'
import { createRateLimiter, type RateLimiter } from './lib/rate-limit.js'
import { issueVoucher, VoucherServiceError } from './lib/voucher-service.js'

interface ApiRequest {
  body?: unknown
  headers: Record<string, string | string[] | undefined>
  method?: string
  socket: { remoteAddress?: string }
}

interface ApiResponse {
  json(body: unknown): void
  setHeader(name: string, value: string): void
  status(code: number): ApiResponse
}

interface HandlerOptions {
  env: Record<string, string | undefined>
  limiter: RateLimiter
  nowMs: () => number
}

const sharedLimiter = createRateLimiter({ limit: 8, windowMs: 60_000 })

const requestIp = (request: ApiRequest): string => {
  const forwarded = request.headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return value?.split(',')[0]?.trim() || request.socket.remoteAddress || 'unknown'
}

export function createVoucherHandler(options: HandlerOptions) {
  return async (request: ApiRequest, response: ApiResponse): Promise<void> => {
    response.setHeader('Cache-Control', 'no-store')
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'method_not_allowed' })
      return
    }
    if (!options.limiter.allow(requestIp(request))) {
      response.status(429).json({ error: 'rate_limited' })
      return
    }
    if (JSON.stringify(request.body ?? null).length > 4_096) {
      response.status(400).json({ error: 'invalid_request' })
      return
    }

    try {
      const config = loadServerConfig(options.env)
      const result = await issueVoucher(request.body, {
        chainId: config.chainId,
        contractAddress: config.contractAddress,
        eventId: config.eventId,
        eventSecret: config.eventSecret,
        nowMs: options.nowMs(),
        signer: new Wallet(config.signerPrivateKey),
      })
      response.status(200).json(result)
    } catch (error) {
      if (error instanceof VoucherServiceError) {
        const status = error.code === 'invalid_request' ? 400 : 403
        response.status(status).json({ error: error.code })
        return
      }
      response.status(500).json({ error: 'server_configuration_error' })
    }
  }
}

const voucherHandler = createVoucherHandler({
  env: process.env,
  limiter: sharedLimiter,
  nowMs: Date.now,
})

export default voucherHandler
