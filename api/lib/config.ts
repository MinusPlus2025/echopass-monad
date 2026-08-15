import { isAddress, isHexString } from 'ethers'

export interface ServerConfig {
  chainId: bigint
  contractAddress: string
  eventId: string
  eventSecret: string
  signerPrivateKey: string
}

export function loadServerConfig(
  env: Record<string, string | undefined>,
): ServerConfig {
  const chainId = env.ECHOPASS_CHAIN_ID ?? '10143'
  const contractAddress = env.ECHOPASS_CONTRACT_ADDRESS
  const eventId = env.ECHOPASS_EVENT_ID
  const eventSecret = env.EVENT_CODE_SECRET
  const signerPrivateKey = env.VOUCHER_SIGNER_PRIVATE_KEY

  if (!/^\d+$/.test(chainId) || BigInt(chainId) !== 10_143n) {
    throw new Error('Invalid server deployment configuration')
  }
  if (!contractAddress || !isAddress(contractAddress)) {
    throw new Error('Invalid server deployment configuration')
  }
  if (!eventId || !isHexString(eventId, 32)) {
    throw new Error('Invalid server deployment configuration')
  }
  if (!eventSecret || eventSecret.length < 16 || !signerPrivateKey) {
    throw new Error('Missing server secret configuration')
  }

  return {
    chainId: BigInt(chainId),
    contractAddress,
    eventId,
    eventSecret,
    signerPrivateKey,
  }
}
