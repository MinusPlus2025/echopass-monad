import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { App } from '../src/App.js'

describe('App shell', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('keeps the selected demo view in the URL', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('tab', { name: 'Host' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Claim' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Verify' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Claim' }))

    expect(window.location.search).toBe('?view=claim')
    expect(
      screen.getByRole('heading', { name: 'Claim your EchoPass' }),
    ).toBeInTheDocument()
  })
})
