import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HostView } from '../src/views/HostView.js'
import { frequenciesForDigit, type PlaybackOptions } from '../src/audio/tone.js'
import { publicConfig } from './fixtures.js'

describe('Host view', () => {
  afterEach(() => vi.useRealTimers())
  it('rotates to the next protected challenge when the current slot expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T10:00:00Z'))
    const fetchChallenge = vi
      .fn()
      .mockResolvedValueOnce({ code: '482913', expiresAt: Date.now() + 1_000 })
      .mockResolvedValueOnce({ code: '731204', expiresAt: Date.now() + 31_000 })

    render(
      <HostView
        config={publicConfig}
        fetchChallenge={fetchChallenge}
        getClaimCount={vi.fn().mockResolvedValue(7)}
        play={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Host access token'), {
      target: { value: 'host-token' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unlock Host' }))
    })
    expect(screen.getByText('482913')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1_000)
      await Promise.resolve()
    })

    expect(screen.getByText('731204')).toBeInTheDocument()
    expect(fetchChallenge).toHaveBeenLastCalledWith('host-token')
  })

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
    expect(play).toHaveBeenCalledWith('482913', expect.any(Object))
    expect(screen.getByLabelText('Sound code visualization')).toBeInTheDocument()
    expect(screen.getAllByTestId('sound-digit')).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Stop playback' })).toBeInTheDocument()
    expect(challenge).toHaveBeenCalledWith('host-token')
  })

  it('highlights each real playback step with its DTMF pair and stops safely', async () => {
    vi.useFakeTimers()
    let playbackSignal: AbortSignal | undefined
    const play = vi.fn((code: string, options?: PlaybackOptions) => {
      playbackSignal = options?.signal
      ;[...code].forEach((digit, index) =>
        options?.onDigit?.(index, digit, frequenciesForDigit(digit)),
      )
    })
    render(
      <HostView
        config={publicConfig}
        fetchChallenge={vi.fn().mockResolvedValue({
          code: '482913',
          expiresAt: Date.now() + 30_000,
        })}
        getClaimCount={vi.fn().mockResolvedValue(7)}
        play={play}
      />,
    )
    fireEvent.change(screen.getByLabelText('Host access token'), {
      target: { value: 'host-token' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unlock Host' }))
    })
    fireEvent.click(screen.getByRole('button', { name: 'Play sound' }))
    await act(async () => vi.advanceTimersByTime(250))

    expect(screen.getByText('852 + 1336 Hz')).toBeInTheDocument()
    expect(screen.getAllByTestId('sound-digit')[1]).toHaveClass('is-active')
    fireEvent.click(screen.getByRole('button', { name: 'Stop playback' }))
    expect(playbackSignal?.aborted).toBe(true)
    expect(screen.getByRole('button', { name: 'Stop playback' })).toBeDisabled()
  })

  it('unlocks Host when the optional onchain claim count is unavailable', async () => {
    const user = userEvent.setup()
    render(
      <HostView
        config={publicConfig}
        fetchChallenge={vi.fn().mockResolvedValue({
          code: '482913',
          expiresAt: Date.now() + 30_000,
        })}
        getClaimCount={vi.fn().mockRejectedValue(new Error('RPC range limit'))}
        play={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('Host access token'), 'host-token')
    await user.click(screen.getByRole('button', { name: 'Unlock Host' }))

    expect(await screen.findByText('482913')).toBeInTheDocument()
    expect(screen.getByText('Claim count unavailable')).toBeInTheDocument()
    expect(screen.queryByText('Unable to unlock Host')).not.toBeInTheDocument()
  })
})
