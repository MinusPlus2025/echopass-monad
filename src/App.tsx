import { useState } from 'react'

import { playCode } from './audio/tone.js'
import { loadPublicConfig } from './config.js'
import { claimCount, hasClaimed } from './contract/client.js'
import { requestVoucher } from './voucher/client.js'
import { ClaimView } from './views/ClaimView.js'
import { HostView } from './views/HostView.js'
import { VerifyView } from './views/VerifyView.js'
import {
  connectMonadWallet,
  createClaimWriter,
  submitClaim,
} from './wallet/client.js'

type View = 'host' | 'claim' | 'verify'

const views: Array<{ id: View; label: string; heading: string }> = [
  { id: 'host', label: 'Host', heading: 'Host an EchoPass event' },
  { id: 'claim', label: 'Claim', heading: 'Claim your EchoPass' },
  { id: 'verify', label: 'Verify', heading: 'Verify an EchoPass' },
]

async function fetchChallenge(token: string) {
  const response = await fetch('/api/challenge', {
    headers: { 'x-host-token': token },
  })
  const data = (await response.json()) as Record<string, unknown>
  if (!response.ok || typeof data.code !== 'string' || typeof data.expiresAt !== 'number') {
    throw new Error('challenge_failed')
  }
  return { code: data.code, expiresAt: data.expiresAt }
}

function viewFromLocation(): View {
  const value = new URLSearchParams(window.location.search).get('view')
  return value === 'claim' || value === 'verify' ? value : 'host'
}

export function App() {
  const [view, setView] = useState<View>(viewFromLocation)
  const selected = views.find((candidate) => candidate.id === view) ?? views[0]
  let config
  try {
    config = loadPublicConfig(import.meta.env)
  } catch {
    config = null
  }

  const selectView = (nextView: View) => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', nextView)
    window.history.pushState(null, '', url)
    setView(nextView)
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#demo-content">
        Skip to demo
      </a>
      <header className="brand-bar">
        <img alt="EchoPass" src="/assets/echopass-mark.svg" />
        <div>
          <span>耳听为实｜Ear Witness</span>
          <strong>Hear the moment. Prove you were there.</strong>
        </div>
      </header>
      <main id="demo-content">
      <nav aria-label="EchoPass demo views" role="tablist">
        {views.map((candidate) => (
          <button
            aria-selected={candidate.id === view}
            key={candidate.id}
            onClick={() => selectView(candidate.id)}
            role="tab"
            type="button"
          >
            {candidate.label}
          </button>
        ))}
      </nav>
      <section aria-label={selected.heading} role="tabpanel">
        {!config ? (
          <div>
            <h1>{selected.heading}</h1>
            <p role="alert">EchoPass deployment is not configured.</p>
          </div>
        ) : view === 'host' ? (
          <HostView
            config={config}
            fetchChallenge={fetchChallenge}
            getClaimCount={() => claimCount(config, config.eventId)}
            play={playCode}
          />
        ) : view === 'claim' ? (
          <ClaimView
            config={config}
            connect={connectMonadWallet}
            createWriter={createClaimWriter}
            ethereum={(window as unknown as { ethereum?: unknown }).ethereum}
            issueVoucher={requestVoucher}
            submit={submitClaim}
          />
        ) : (
          <VerifyView
            config={config}
            verify={(eventId, wallet) => hasClaimed(config, eventId, wallet)}
          />
        )}
      </section>
      </main>
      <footer>Monad Testnet · Chain 10143</footer>
    </div>
  )
}
