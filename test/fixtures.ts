import type { PublicConfig } from '../src/config.js'

export const publicConfig: PublicConfig = {
  chainId: 10_143,
  contractAddress: '0x1111111111111111111111111111111111111111',
  eventId: `0x${'22'.repeat(32)}`,
  eventName: 'Monad Blitz Demo',
  explorerUrl: 'https://testnet.monadscan.com',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
}
