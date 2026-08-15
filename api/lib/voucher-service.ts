import { timingSafeEqual } from 'node:crypto'

import {
  getAddress,
  id,
  isAddress,
  isHexString,
  type Signer,
} from 'ethers'

import { acceptedCodes } from '../../src/domain/code.js'
import { signVoucher, type Voucher } from '../../src/domain/voucher.js'

export type VoucherErrorCode =
  | 'invalid_code'
  | 'invalid_request'
  | 'unsupported_deployment'

export class VoucherServiceError extends Error {
  constructor(public readonly code: VoucherErrorCode) {
    super(code)
    this.name = 'VoucherServiceError'
  }
}

export interface VoucherServiceContext {
  chainId: bigint
  contractAddress: string
  eventId: string
  eventSecret: string
  nowMs: number
  signer: Pick<Signer, 'signMessage'>
}

export interface VoucherResponse {
  signature: string
  voucher: {
    chainId: string
    claimant: string
    contractAddress: string
    eventId: string
    signalHash: string
    validUntil: string
  }
}

interface VoucherRequest {
  chainId: number
  claimant: string
  code: string
  contractAddress: string
  eventId: string
}

function parseRequest(input: unknown): VoucherRequest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new VoucherServiceError('invalid_request')
  }

  const request = input as Record<string, unknown>
  if (
    !Number.isSafeInteger(request.chainId) ||
    typeof request.claimant !== 'string' ||
    !isAddress(request.claimant) ||
    typeof request.code !== 'string' ||
    !/^\d{6}$/.test(request.code) ||
    typeof request.contractAddress !== 'string' ||
    !isAddress(request.contractAddress) ||
    typeof request.eventId !== 'string' ||
    !isHexString(request.eventId, 32)
  ) {
    throw new VoucherServiceError('invalid_request')
  }

  return request as unknown as VoucherRequest
}

function equalCode(actual: string, expected: string): boolean {
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}

export async function issueVoucher(
  input: unknown,
  context: VoucherServiceContext,
): Promise<VoucherResponse> {
  const request = parseRequest(input)
  if (
    BigInt(request.chainId) !== context.chainId ||
    getAddress(request.contractAddress) !== getAddress(context.contractAddress) ||
    request.eventId.toLowerCase() !== context.eventId.toLowerCase()
  ) {
    throw new VoucherServiceError('unsupported_deployment')
  }

  const codes = await acceptedCodes(
    context.eventId,
    context.eventSecret,
    context.nowMs,
  )
  if (!codes.some((code) => equalCode(request.code, code))) {
    throw new VoucherServiceError('invalid_code')
  }

  const voucher: Voucher = {
    chainId: context.chainId,
    claimant: getAddress(request.claimant),
    contractAddress: getAddress(context.contractAddress),
    eventId: context.eventId,
    signalHash: id(`echopass:${context.eventId}:${request.code}`),
    validUntil: BigInt(Math.floor(context.nowMs / 1_000) + 90),
  }

  return {
    signature: await signVoucher(context.signer, voucher),
    voucher: {
      ...voucher,
      chainId: voucher.chainId.toString(),
      validUntil: voucher.validUntil.toString(),
    },
  }
}
