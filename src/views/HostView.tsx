import { useEffect, useState } from 'react'

import { explorerAddressUrl, type PublicConfig } from '../config.js'
import { frequenciesForDigit, type PlaybackOptions } from '../audio/tone.js'

interface Challenge {
  code: string
  expiresAt: number
}

interface HostViewProps {
  config: PublicConfig
  fetchChallenge(token: string): Promise<Challenge>
  getClaimCount(): Promise<number>
  play(code: string, options?: PlaybackOptions): Promise<void> | void
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
  const [activeDigit, setActiveDigit] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [controller, setController] = useState<AbortController | null>(null)
  const timers = useState<number[]>([])[0]

  const stopPlayback = () => {
    controller?.abort()
    timers.splice(0).forEach((timer) => window.clearTimeout(timer))
    setActiveDigit(null)
    setPlaying(false)
  }

  const startPlayback = () => {
    if (!challenge) return
    stopPlayback()
    const nextController = new AbortController()
    setController(nextController)
    setPlaying(true)
    void play(challenge.code, {
      signal: nextController.signal,
      onDigit: (index) => {
        timers.push(window.setTimeout(() => setActiveDigit(index), index * 250))
      },
    })
    timers.push(window.setTimeout(stopPlayback, 1_500))
  }

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
          <div className="sound-stage" aria-label="Sound code visualization">
            <span className="sr-only">{challenge.code}</span>
            <div className="sound-stage__header">
              <span>LIVE SOUND CODE</span>
              <strong>{activeDigit === null ? 'Ready' : challenge.code[activeDigit]}</strong>
              <span>{activeDigit === null ? 'Dual-tone presence signal' : `${frequenciesForDigit(challenge.code[activeDigit]).join(' + ')} Hz`}</span>
            </div>
            <div className="sound-digits">
              {[...challenge.code].map((digit, index) => {
                const [low, high] = frequenciesForDigit(digit)
                return <div className={`sound-digit ${activeDigit === index ? 'is-active' : ''}`} data-testid="sound-digit" key={`${digit}-${index}`}>
                  <i style={{ '--low': low / 1500, '--high': high / 1500 } as React.CSSProperties} />
                  <b>{digit}</b><small>{low} · {high}</small>
                </div>
              })}
            </div>
          </div>
          <p>{Math.max(0, Math.ceil((challenge.expiresAt - now) / 1_000))} seconds</p>
          <button onClick={startPlayback} type="button">
            Play sound
          </button>
          <button disabled={!playing} onClick={stopPlayback} type="button">Stop playback</button>
          <p>{count === null ? 'Claim count unavailable' : `${count} claims`}</p>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      <a href={explorerAddressUrl(config.contractAddress)}>View contract</a>
    </section>
  )
}
