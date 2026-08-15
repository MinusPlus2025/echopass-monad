import { describe, expect, it, vi } from 'vitest'

import { requestVoucher } from '../src/voucher/client.js'

const request = {
  chainId: 10_143,
  claimant: '0x3333333333333333333333333333333333333333',
  code: '482913',
  contractAddress: '0x1111111111111111111111111111111111111111',
  eventId: `0x${'22'.repeat(32)}`,
}

describe('voucher HTTP client', () => {
  it('posts the exact request and converts integer fields to bigint', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
        signature: `0x${'ab'.repeat(65)}`,
        voucher: {
          chainId: '10143',
          claimant: request.claimant,
          contractAddress: request.contractAddress,
          eventId: request.eventId,
          signalHash: `0x${'44'.repeat(32)}`,
          validUntil: '1800000090',
        },
      }),
      ok: true,
    })

    const response = await requestVoucher(fetcher, request)

    expect(fetcher).toHaveBeenCalledWith('/api/voucher', {
      body: JSON.stringify(request),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    expect(response.voucher.chainId).toBe(10_143n)
    expect(response.voucher.validUntil).toBe(1_800_000_090n)
  })

  it('surfaces public API errors and rejects malformed success data', async () => {
    await expect(
      requestVoucher(
        vi.fn().mockResolvedValue({
          json: async () => ({ error: 'invalid_code' }),
          ok: false,
        }),
        request,
      ),
    ).rejects.toThrow('invalid_code')

    await expect(
      requestVoucher(
        vi.fn().mockResolvedValue({
          json: async () => ({ signature: 'bad', voucher: {} }),
          ok: true,
        }),
        request,
      ),
    ).rejects.toThrow('Invalid voucher response')
  })
})
