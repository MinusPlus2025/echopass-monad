import { useState } from 'react'
import { isAddress } from 'ethers'

import {
  explorerAddressUrl,
  type PublicConfig,
} from '../config.js'

interface VerifyViewProps {
  config: PublicConfig
  verify(eventId: string, wallet: string): Promise<boolean>
}

export function VerifyView({ config, verify }: VerifyViewProps) {
  const [wallet, setWallet] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  const check = async () => {
    if (!isAddress(wallet)) {
      setError('Enter a valid wallet address')
      return
    }
    setError('')
    try {
      setResult(await verify(config.eventId, wallet))
    } catch {
      setError('Monad verification unavailable')
    }
  }

  return (
    <section>
      <h1>Verify an EchoPass</h1>
      <p>{config.eventName}</p>
      <label>
        Wallet address
        <input onChange={(event) => setWallet(event.target.value)} value={wallet} />
      </label>
      <button onClick={check} type="button">
        Verify on Monad
      </button>
      {result !== null && <p>{result ? 'Credential verified' : 'No credential found'}</p>}
      {error && <p role="alert">{error}</p>}
      <a href={explorerAddressUrl(config.contractAddress)}>View contract</a>
    </section>
  )
}
