import {
  BrowserProvider,
  Contract,
  getAddress,
  type Eip1193Provider,
} from 'ethers'

import { explorerTxUrl } from '../config.js'
import { echoPassAbi } from '../contract/abi.js'
import type { ClientVoucherResponse } from '../voucher/client.js'

const MONAD_CHAIN_HEX = '0x279f'

export interface ConnectedWallet {
  address: string
  ethereum: Eip1193Provider
}

export interface ClaimWriter {
  claim(
    eventId: string,
    validUntil: bigint,
    signalHash: string,
    signature: string,
    overrides: { gasLimit: bigint },
  ): Promise<{ hash: string; wait(): Promise<unknown> }>
  estimateClaimGas(
    eventId: string,
    validUntil: bigint,
    signalHash: string,
    signature: string,
  ): Promise<bigint>
  hasClaimed(eventId: string, claimant: string): Promise<boolean>
}

export async function connectMonadWallet(
  ethereum: Eip1193Provider,
): Promise<ConnectedWallet> {
  const accounts = (await ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[]
  if (!accounts[0]) throw new Error('No wallet account available')

  const chainId = (await ethereum.request({ method: 'eth_chainId' })) as string
  if (chainId.toLowerCase() !== MONAD_CHAIN_HEX) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_CHAIN_HEX }],
      })
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 4902) {
        throw error
      }
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            blockExplorerUrls: ['https://testnet.monadscan.com'],
            chainId: MONAD_CHAIN_HEX,
            chainName: 'Monad Testnet',
            nativeCurrency: { decimals: 18, name: 'MON', symbol: 'MON' },
            rpcUrls: ['https://testnet-rpc.monad.xyz'],
          },
        ],
      })
    }
  }

  return { address: getAddress(accounts[0]), ethereum }
}

export async function createClaimWriter(
  wallet: ConnectedWallet,
  contractAddress: string,
): Promise<ClaimWriter> {
  const provider = new BrowserProvider(wallet.ethereum)
  const signer = await provider.getSigner(wallet.address)
  const contract = new Contract(contractAddress, echoPassAbi, signer)

  return {
    claim: (eventId, validUntil, signalHash, signature, overrides) =>
      contract.claim(eventId, validUntil, signalHash, signature, overrides),
    estimateClaimGas: (eventId, validUntil, signalHash, signature) =>
      contract.claim.estimateGas(eventId, validUntil, signalHash, signature),
    hasClaimed: async (eventId, claimant) =>
      Boolean(await contract.hasClaimed(eventId, claimant)),
  }
}

export async function submitClaim(
  writer: ClaimWriter,
  response: ClientVoucherResponse,
): Promise<{ hash: string; transactionUrl: string }> {
  const { signature, voucher } = response
  if (await writer.hasClaimed(voucher.eventId, voucher.claimant)) {
    throw new Error('Already claimed')
  }
  const estimate = await writer.estimateClaimGas(
    voucher.eventId,
    voucher.validUntil,
    voucher.signalHash,
    signature,
  )
  const transaction = await writer.claim(
    voucher.eventId,
    voucher.validUntil,
    voucher.signalHash,
    signature,
    { gasLimit: estimate + estimate / 10n },
  )
  await transaction.wait()
  return {
    hash: transaction.hash,
    transactionUrl: explorerTxUrl(transaction.hash),
  }
}
