import { describe, expect, it, vi } from 'vitest'

import { claimCount, hasClaimed } from '../src/contract/client.js'
import type { PublicConfig } from '../src/config.js'

const config: PublicConfig = {
  chainId: 10_143,
  contractAddress: '0x1111111111111111111111111111111111111111',
  eventId: `0x${'22'.repeat(32)}`,
  eventName: 'Monad Blitz Demo',
  explorerUrl: 'https://testnet.monadscan.com',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
}

describe('read-only EchoPass client', () => {
  it('reads the credential for the exact event and wallet', async () => {
    const readHasClaimed = vi.fn().mockResolvedValue(true)

    await expect(
      hasClaimed(
        config,
        config.eventId,
        '0x3333333333333333333333333333333333333333',
        { hasClaimed: readHasClaimed, presenceClaims: vi.fn() },
      ),
    ).resolves.toBe(true)
    expect(readHasClaimed).toHaveBeenCalledWith(
      config.eventId,
      '0x3333333333333333333333333333333333333333',
    )
  })

  it('counts only PresenceClaimed logs for the configured event', async () => {
    const presenceClaims = vi.fn().mockResolvedValue([{}, {}, {}])

    await expect(
      claimCount(config, config.eventId, {
        hasClaimed: vi.fn(),
        presenceClaims,
      }),
    ).resolves.toBe(3)
    expect(presenceClaims).toHaveBeenCalledWith(config.eventId)
  })
})
