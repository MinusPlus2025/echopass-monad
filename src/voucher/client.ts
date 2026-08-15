import { isAddress, isHexString } from 'ethers'

import type { Voucher } from '../domain/voucher.js'

export interface VoucherRequest {
  chainId: number
  claimant: string
  code: string
  contractAddress: string
  eventId: string
}

export interface ClientVoucherResponse {
  signature: string
  voucher: Voucher
}

interface FetchResponse {
  json(): Promise<unknown>
  ok: boolean
}

export type Fetcher = (
  input: string,
  init: { body: string; headers: Record<string, string>; method: string },
) => Promise<FetchResponse>

export async function requestVoucher(
  fetcher: Fetcher,
  request: VoucherRequest,
): Promise<ClientVoucherResponse> {
  const response = await fetcher('/api/voucher', {
    body: JSON.stringify(request),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const data = await response.json()
  if (!response.ok) {
    const error =
      data && typeof data === 'object' && 'error' in data
        ? String(data.error)
        : 'voucher_request_failed'
    throw new Error(error)
  }
  if (!validResponse(data)) {
    throw new Error('Invalid voucher response')
  }

  return {
    signature: data.signature,
    voucher: {
      ...data.voucher,
      chainId: BigInt(data.voucher.chainId),
      validUntil: BigInt(data.voucher.validUntil),
    },
  }
}

function validResponse(data: unknown): data is {
  signature: string
  voucher: Record<keyof Voucher, string>
} {
  if (!data || typeof data !== 'object' || !('voucher' in data)) return false
  const value = data as Record<string, unknown>
  const voucher = value.voucher as Record<string, unknown> | null
  return Boolean(
    typeof value.signature === 'string' &&
      isHexString(value.signature, 65) &&
      voucher &&
      typeof voucher.chainId === 'string' &&
      /^\d+$/.test(voucher.chainId) &&
      typeof voucher.contractAddress === 'string' &&
      isAddress(voucher.contractAddress) &&
      typeof voucher.eventId === 'string' &&
      isHexString(voucher.eventId, 32) &&
      typeof voucher.claimant === 'string' &&
      isAddress(voucher.claimant) &&
      typeof voucher.signalHash === 'string' &&
      isHexString(voucher.signalHash, 32) &&
      typeof voucher.validUntil === 'string' &&
      /^\d+$/.test(voucher.validUntil),
  )
}
