import { useEffect, useState } from 'react'

import { explorerAddressUrl, type PublicConfig } from '../config.js'

interface Challenge {
  code: string
  expiresAt: number
}

interface HostViewProps {
  config: PublicConfig
  fetchChallenge(token: string): Promise<Challenge>
  getClaimCount(): Promise<number>
  play(code: string): Promise<void> | void
}

export function HostView({
  config,
  fetchChallenge,
  getClaimCount,
  play,
}: HostViewProps) {
  const [token, setToken] = useState('')
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!challenge) return
    const timer = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(timer)
  }, [challenge])

  const unlock = async () => {
    setError('')
    try {
      const nextChallenge = await fetchChallenge(token)
      setChallenge(nextChallenge)
      setToken('')
      try {
        setCount(await getClaimCount())
      } catch {
        setCount(null)
      }
    } catch {
      setError('Unable to unlock Host')
    }
  }

  return (
    <section>
      <h1>Host an EchoPass event</h1>
      <p>{config.eventName}</p>
      {!challenge ? (
        <div>
          <label>
            Host access token
            <input
              autoComplete="off"
              onChange={(event) => setToken(event.target.value)}
              type="password"
              value={token}
            />
          </label>
          <button disabled={!token} onClick={unlock} type="button">
            Unlock Host
          </button>
        </div>
      ) : (
        <div>
          <strong>{challenge.code}</strong>
          <p>{Math.max(0, Math.ceil((challenge.expiresAt - now) / 1_000))} seconds</p>
          <button onClick={() => play(challenge.code)} type="button">
            Play sound
          </button>
          <p>{count === null ? 'Claim count unavailable' : `${count} claims`}</p>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <a href={explorerAddressUrl(config.contractAddress)}>View contract</a>
    </section>
  )
}
