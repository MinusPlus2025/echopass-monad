import {
  AbiCoder,
  Wallet,
  getBytes,
  keccak256,
  recoverAddress,
  verifyMessage,
} from 'ethers'
import { describe, expect, it } from 'vitest'

import { signVoucher, voucherDigest } from '../src/domain/voucher'

const voucher = {
  chainId: 10_143n,
  contractAddress: '0x1111111111111111111111111111111111111111',
  eventId:
    '0x2222222222222222222222222222222222222222222222222222222222222222',
  claimant: '0x3333333333333333333333333333333333333333',
  signalHash:
    '0x4444444444444444444444444444444444444444444444444444444444444444',
  validUntil: 1_800_000_000n,
}

describe('voucher boundary', () => {
  it('hashes fields in the Solidity abi.encode order', () => {
    const expected = keccak256(
      AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'address', 'bytes32', 'address', 'bytes32', 'uint64'],
        [
          10_143n,
          '0x1111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222222222222222222222222222',
          '0x3333333333333333333333333333333333333333',
          '0x4444444444444444444444444444444444444444444444444444444444444444',
          1_800_000_000n,
        ],
      ),
    )

    expect(voucherDigest(voucher)).toBe(expected)
  })

  it('signs the digest as an Ethereum signed message', async () => {
    const signer = new Wallet(
      '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    )
    const digest = voucherDigest(voucher)
    const signature = await signVoucher(signer, voucher)

    expect(verifyMessage(getBytes(digest), signature)).toBe(signer.address)
    expect(recoverAddress(digest, signature)).not.toBe(signer.address)
  })
})
