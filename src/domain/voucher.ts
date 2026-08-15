import { AbiCoder, getBytes, keccak256, type Signer } from 'ethers'

export interface Voucher {
  chainId: bigint
  contractAddress: string
  eventId: string
  claimant: string
  signalHash: string
  validUntil: bigint
}

const VOUCHER_TYPES = [
  'uint256',
  'address',
  'bytes32',
  'address',
  'bytes32',
  'uint64',
] as const

export function voucherDigest(voucher: Voucher): string {
  const encoded = AbiCoder.defaultAbiCoder().encode(VOUCHER_TYPES, [
    voucher.chainId,
    voucher.contractAddress,
    voucher.eventId,
    voucher.claimant,
    voucher.signalHash,
    voucher.validUntil,
  ])

  return keccak256(encoded)
}

export async function signVoucher(
  signer: Pick<Signer, 'signMessage'>,
  voucher: Voucher,
): Promise<string> {
  return signer.signMessage(getBytes(voucherDigest(voucher)))
}
