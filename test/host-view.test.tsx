import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HostView } from '../src/views/HostView.js'
import { publicConfig } from './fixtures.js'

describe('Host view', () => {
  it('unlocks the rotating code in memory, plays it, and shows onchain count', async () => {
    const user = userEvent.setup()
    const play = vi.fn()
    const challenge = vi.fn().mockResolvedValue({
      code: '482913',
      expiresAt: Date.now() + 30_000,
    })
    render(
      <HostView
        config={publicConfig}
        fetchChallenge={challenge}
        getClaimCount={vi.fn().mockResolvedValue(7)}
        play={play}
      />,
    )

    await user.type(screen.getByLabelText('Host access token'), 'host-token')
    await user.click(screen.getByRole('button', { name: 'Unlock Host' }))

    expect(await screen.findByText('482913')).toBeInTheDocument()
    expect(screen.getByText('7 claims')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Play sound' }))
    expect(play).toHaveBeenCalledWith('482913')
    expect(challenge).toHaveBeenCalledWith('host-token')
  })
})
