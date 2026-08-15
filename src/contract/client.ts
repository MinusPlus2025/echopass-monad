import { Contract, JsonRpcProvider } from 'ethers'

import type { PublicConfig } from '../config.js'
import { echoPassAbi } from './abi.js'

export interface EchoPassReader {
  hasClaimed(eventId: string, claimant: string): Promise<boolean>
  presenceClaims(eventId: string): Promise<unknown[]>
}

function defaultReader(config: PublicConfig): EchoPassReader {
  const provider = new JsonRpcProvider(config.rpcUrl, config.chainId)
  const contract = new Contract(config.contractAddress, echoPassAbi, provider)

  return {
    hasClaimed: async (eventId, claimant) =>
      Boolean(await contract.hasClaimed(eventId, claimant)),
    presenceClaims: async (eventId) => {
      const filter = contract.filters.PresenceClaimed(eventId)
      return contract.queryFilter(filter)
    },
  }
}

export async function hasClaimed(
  config: PublicConfig,
  eventId: string,
  claimant: string,
  reader = defaultReader(config),
): Promise<boolean> {
  return reader.hasClaimed(eventId, claimant)
}

export async function claimCount(
  config: PublicConfig,
  eventId: string,
  reader = defaultReader(config),
): Promise<number> {
  return (await reader.presenceClaims(eventId)).length
}
