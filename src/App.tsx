import { useState } from 'react'

type View = 'host' | 'claim' | 'verify'

const views: Array<{ id: View; label: string; heading: string }> = [
  { id: 'host', label: 'Host', heading: 'Host an EchoPass event' },
  { id: 'claim', label: 'Claim', heading: 'Claim your EchoPass' },
  { id: 'verify', label: 'Verify', heading: 'Verify an EchoPass' },
]

function viewFromLocation(): View {
  const value = new URLSearchParams(window.location.search).get('view')
  return value === 'claim' || value === 'verify' ? value : 'host'
}

export function App() {
  const [view, setView] = useState<View>(viewFromLocation)
  const selected = views.find((candidate) => candidate.id === view) ?? views[0]

  const selectView = (nextView: View) => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', nextView)
    window.history.pushState(null, '', url)
    setView(nextView)
  }

  return (
    <main>
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
      <section aria-labelledby={`${selected.id}-heading`} role="tabpanel">
        <h1 id={`${selected.id}-heading`}>{selected.heading}</h1>
      </section>
    </main>
  )
}
