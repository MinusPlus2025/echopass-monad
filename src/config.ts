import { isAddress, isHexString } from 'ethers'

export const MONAD_TESTNET_CHAIN_ID = 10_143
export const MONAD_TESTNET_RPC_URL = 'https://testnet-rpc.monad.xyz'
export const MONAD_TESTNET_EXPLORER_URL = 'https://testnet.monadscan.com'

export interface PublicConfig {
  chainId: number
  contractAddress: string
  eventId: string
  eventName: string
  explorerUrl: string
  rpcUrl: string
}

export function loadPublicConfig(
  env: Record<string, string | undefined>,
): PublicConfig {
  const contractAddress = env.VITE_CONTRACT_ADDRESS
  const eventId = env.VITE_EVENT_ID

  if (!contractAddress || !isAddress(contractAddress)) {
    throw new Error('Invalid or missing contract address')
  }
  if (!eventId || !isHexString(eventId, 32)) {
    throw new Error('Invalid or missing event ID')
  }

  return {
    chainId: MONAD_TESTNET_CHAIN_ID,
    contractAddress,
    eventId,
    eventName: env.VITE_EVENT_NAME?.trim() || 'EchoPass Monad Blitz Demo',
    explorerUrl: MONAD_TESTNET_EXPLORER_URL,
    rpcUrl: MONAD_TESTNET_RPC_URL,
  }
}

export const explorerAddressUrl = (address: string): string =>
  `${MONAD_TESTNET_EXPLORER_URL}/address/${address}`

export const explorerTxUrl = (hash: string): string =>
  `${MONAD_TESTNET_EXPLORER_URL}/tx/${hash}`
