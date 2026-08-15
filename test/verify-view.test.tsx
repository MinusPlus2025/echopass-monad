import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { VerifyView } from '../src/views/VerifyView.js'
import { publicConfig } from './fixtures.js'

describe('Verify view', () => {
  it('validates a wallet and displays the real onchain credential result', async () => {
    const user = userEvent.setup()
    const verify = vi.fn().mockResolvedValue(true)
    render(<VerifyView config={publicConfig} verify={verify} />)

    await user.type(
      screen.getByLabelText('Wallet address'),
      '0x3333333333333333333333333333333333333333',
    )
    await user.click(screen.getByRole('button', { name: 'Verify on Monad' }))

    expect(await screen.findByText('Credential verified')).toBeInTheDocument()
    expect(verify).toHaveBeenCalledWith(
      publicConfig.eventId,
      '0x3333333333333333333333333333333333333333',
    )
    expect(screen.getByRole('link', { name: 'View contract' })).toHaveAttribute(
      'href',
      expect.stringContaining('/address/'),
    )
  })
})
