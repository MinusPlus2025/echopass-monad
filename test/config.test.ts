import { describe, expect, it } from 'vitest'

import {
  explorerAddressUrl,
  explorerTxUrl,
  loadPublicConfig,
} from '../src/config.js'

const contractAddress = '0x1111111111111111111111111111111111111111'
const eventId = `0x${'22'.repeat(32)}`

describe('public Monad configuration', () => {
  it('loads the fixed Monad Testnet defaults with validated deployment IDs', () => {
    expect(
      loadPublicConfig({
        VITE_CONTRACT_ADDRESS: contractAddress,
        VITE_EVENT_ID: eventId,
        VITE_EVENT_NAME: 'Monad Blitz Demo',
      }),
    ).toEqual({
      chainId: 10_143,
      contractAddress,
      eventId,
      eventName: 'Monad Blitz Demo',
      explorerUrl: 'https://testnet.monadscan.com',
      rpcUrl: 'https://testnet-rpc.monad.xyz',
    })
  })

  it.each([
    [{ VITE_EVENT_ID: eventId }, 'contract address'],
    [
      { VITE_CONTRACT_ADDRESS: 'not-an-address', VITE_EVENT_ID: eventId },
      'contract address',
    ],
    [{ VITE_CONTRACT_ADDRESS: contractAddress }, 'event ID'],
    [
      { VITE_CONTRACT_ADDRESS: contractAddress, VITE_EVENT_ID: '0x1234' },
      'event ID',
    ],
  ])('rejects incomplete or malformed deployment config', (env, message) => {
    expect(() => loadPublicConfig(env)).toThrow(message)
  })

  it('builds exact testnet explorer links', () => {
    expect(explorerAddressUrl(contractAddress)).toBe(
      `https://testnet.monadscan.com/address/${contractAddress}`,
    )
    expect(explorerTxUrl(`0x${'ab'.repeat(32)}`)).toBe(
      `https://testnet.monadscan.com/tx/0x${'ab'.repeat(32)}`,
    )
  })
})
