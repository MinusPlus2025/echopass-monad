import { describe, expect, it, vi } from 'vitest'

import { connectMonadWallet, submitClaim } from '../src/wallet/client.js'

const claimant = '0x3333333333333333333333333333333333333333'
const voucher = {
  signature: `0x${'ab'.repeat(65)}`,
  voucher: {
    chainId: 10_143n,
    claimant,
    contractAddress: '0x1111111111111111111111111111111111111111',
    eventId: `0x${'22'.repeat(32)}`,
    signalHash: `0x${'44'.repeat(32)}`,
    validUntil: 1_800_000_090n,
  },
}

describe('Monad injected wallet client', () => {
  it('requests an account and switches to Monad Testnet', async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === 'eth_requestAccounts') return [claimant]
      if (method === 'eth_chainId') return '0x1'
      if (method === 'wallet_switchEthereumChain') return null
      throw new Error(`Unexpected method ${method}`)
    })

    await expect(connectMonadWallet({ request })).resolves.toMatchObject({
      address: claimant,
    })
    expect(request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x279f' }],
    })
  })

  it('adds Monad Testnet when the wallet does not know the chain', async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === 'eth_requestAccounts') return [claimant]
      if (method === 'eth_chainId') return '0x1'
      if (method === 'wallet_switchEthereumChain') {
        throw Object.assign(new Error('unknown chain'), { code: 4902 })
      }
      if (method === 'wallet_addEthereumChain') return null
      throw new Error(`Unexpected method ${method}`)
    })

    await connectMonadWallet({ request })
    expect(request).toHaveBeenCalledWith({
      method: 'wallet_addEthereumChain',
      params: [
        expect.objectContaining({
          blockExplorerUrls: ['https://testnet.monadscan.com'],
          chainId: '0x279f',
          rpcUrls: ['https://testnet-rpc.monad.xyz'],
        }),
      ],
    })
  })

  it('preflights duplicates and submits exact voucher fields with a 10% gas buffer', async () => {
    const transaction = { hash: `0x${'66'.repeat(32)}`, wait: vi.fn() }
    const writer = {
      claim: vi.fn().mockResolvedValue(transaction),
      estimateClaimGas: vi.fn().mockResolvedValue(100_000n),
      hasClaimed: vi.fn().mockResolvedValue(false),
    }

    await expect(submitClaim(writer, voucher)).resolves.toEqual({
      hash: transaction.hash,
      transactionUrl: `https://testnet.monadscan.com/tx/${transaction.hash}`,
    })
    expect(writer.estimateClaimGas).toHaveBeenCalledWith(
      voucher.voucher.eventId,
      voucher.voucher.validUntil,
      voucher.voucher.signalHash,
      voucher.signature,
    )
    expect(writer.claim).toHaveBeenCalledWith(
      voucher.voucher.eventId,
      voucher.voucher.validUntil,
      voucher.voucher.signalHash,
      voucher.signature,
      { gasLimit: 110_000n },
    )
    expect(transaction.wait).toHaveBeenCalledOnce()

    writer.hasClaimed.mockResolvedValue(true)
    await expect(submitClaim(writer, voucher)).rejects.toThrow('Already claimed')
  })
})
