// @vitest-environment node
import { getBytes, verifyMessage, Wallet } from 'ethers'
import { describe, expect, it, vi } from 'vitest'

import { deriveCode, timeSlot } from '../src/domain/code.js'
import { voucherDigest } from '../src/domain/voucher.js'
import {
  issueVoucher,
  VoucherServiceError,
} from '../api/lib/voucher-service.js'
import { createRateLimiter } from '../api/lib/rate-limit.js'
import { createVoucherHandler } from '../api/voucher.js'

const nowMs = 1_800_000_000_000
const contractAddress = '0x1111111111111111111111111111111111111111'
const claimant = '0x3333333333333333333333333333333333333333'
const eventId = `0x${'22'.repeat(32)}`
const eventSecret = 'server-only-event-secret'

async function fixture() {
  const signer = Wallet.createRandom()
  const code = await deriveCode(eventId, eventSecret, timeSlot(nowMs))
  return {
    code,
    context: {
      chainId: 10_143n,
      contractAddress,
      eventId,
      eventSecret,
      nowMs,
      signer,
    },
    signer,
  }
}

describe('server-only voucher service', () => {
  it('issues an exactly 90-second wallet-bound voucher for the current code', async () => {
    const { code, context, signer } = await fixture()
    const response = await issueVoucher(
      { chainId: 10_143, claimant, code, contractAddress, eventId },
      context,
    )

    expect(response.voucher).toEqual({
      chainId: '10143',
      claimant,
      contractAddress,
      eventId,
      signalHash: response.voucher.signalHash,
      validUntil: '1800000090',
    })
    expect(response.voucher.signalHash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(
      verifyMessage(
        getBytes(
          voucherDigest({
            ...response.voucher,
            chainId: BigInt(response.voucher.chainId),
            validUntil: BigInt(response.voucher.validUntil),
          }),
        ),
        response.signature,
      ),
    ).toBe(signer.address)
  })

  it('accepts the previous 30-second code', async () => {
    const { context } = await fixture()
    const previousCode = await deriveCode(
      eventId,
      eventSecret,
      timeSlot(nowMs) - 1,
    )

    await expect(
      issueVoucher(
        {
          chainId: 10_143,
          claimant,
          code: previousCode,
          contractAddress,
          eventId,
        },
        context,
      ),
    ).resolves.toMatchObject({ voucher: { claimant } })
  })

  it.each([
    ['wrong code', { code: '000000' }, 'invalid_code'],
    ['wrong chain', { chainId: 1 }, 'unsupported_deployment'],
    [
      'wrong contract',
      { contractAddress: '0x4444444444444444444444444444444444444444' },
      'unsupported_deployment',
    ],
    ['wrong event', { eventId: `0x${'55'.repeat(32)}` }, 'unsupported_deployment'],
    ['malformed claimant', { claimant: 'no-wallet' }, 'invalid_request'],
    ['malformed code', { code: '12345' }, 'invalid_request'],
  ])('rejects %s without exposing validation details', async (_, override, code) => {
    const { code: validCode, context } = await fixture()
    const request = {
      chainId: 10_143,
      claimant,
      code: validCode,
      contractAddress,
      eventId,
      ...override,
    }

    await expect(issueVoucher(request, context)).rejects.toMatchObject({
      code: code as VoucherServiceError['code'],
    } satisfies Partial<VoucherServiceError>)
  })
})

describe('voucher HTTP boundary', () => {
  it('limits an IP within the window and permits it after expiry', () => {
    let now = 1_000
    const limiter = createRateLimiter({
      limit: 2,
      now: () => now,
      windowMs: 1_000,
    })

    expect(limiter.allow('203.0.113.10')).toBe(true)
    expect(limiter.allow('203.0.113.10')).toBe(true)
    expect(limiter.allow('203.0.113.10')).toBe(false)
    now = 2_001
    expect(limiter.allow('203.0.113.10')).toBe(true)
  })

  it('rejects unsupported methods without constructing a signer', async () => {
    const response = responseFixture()
    const handler = createVoucherHandler({
      env: {},
      limiter: { allow: vi.fn().mockReturnValue(true) },
      nowMs: () => nowMs,
    })

    await handler(
      { body: undefined, headers: {}, method: 'GET', socket: {} },
      response,
    )

    expect(response.status).toHaveBeenCalledWith(405)
    expect(response.json).toHaveBeenCalledWith({ error: 'method_not_allowed' })
  })

  it('returns a public success body and generic rate-limit error', async () => {
    const signer = Wallet.createRandom()
    const code = await deriveCode(eventId, eventSecret, timeSlot(nowMs))
    const env = {
      ECHOPASS_CHAIN_ID: '10143',
      ECHOPASS_CONTRACT_ADDRESS: contractAddress,
      ECHOPASS_EVENT_ID: eventId,
      EVENT_CODE_SECRET: eventSecret,
      VOUCHER_SIGNER_PRIVATE_KEY: signer.privateKey,
    }
    const allowedResponse = responseFixture()
    const allowed = createVoucherHandler({
      env,
      limiter: { allow: vi.fn().mockReturnValue(true) },
      nowMs: () => nowMs,
    })
    await allowed(
      {
        body: { chainId: 10_143, claimant, code, contractAddress, eventId },
        headers: { 'x-forwarded-for': '203.0.113.10' },
        method: 'POST',
        socket: {},
      },
      allowedResponse,
    )
    expect(allowedResponse.status).toHaveBeenCalledWith(200)
    expect(allowedResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ signature: expect.stringMatching(/^0x/) }),
    )

    const limitedResponse = responseFixture()
    const limited = createVoucherHandler({
      env,
      limiter: { allow: vi.fn().mockReturnValue(false) },
      nowMs: () => nowMs,
    })
    await limited(
      {
        body: {},
        headers: { 'x-forwarded-for': '203.0.113.10' },
        method: 'POST',
        socket: {},
      },
      limitedResponse,
    )
    expect(limitedResponse.status).toHaveBeenCalledWith(429)
    expect(limitedResponse.json).toHaveBeenCalledWith({ error: 'rate_limited' })
  })
})

function responseFixture() {
  const response = {
    json: vi.fn(),
    setHeader: vi.fn(),
    status: vi.fn(),
  }
  response.status.mockReturnValue(response)
  return response
}
