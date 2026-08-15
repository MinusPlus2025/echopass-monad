import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ClaimView } from '../src/views/ClaimView.js'
import { publicConfig } from './fixtures.js'

describe('Claim view', () => {
  it('fills the challenge from microphone recognition and keeps fallback available', async () => {
    const user = userEvent.setup()
    render(
      <ClaimView
        config={publicConfig}
        connect={vi.fn()}
        createWriter={vi.fn()}
        ethereum={{}}
        issueVoucher={vi.fn()}
        listen={vi.fn().mockResolvedValue('482913')}
        submit={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Listen for code' }))
    expect(
      screen.getByLabelText('识别备用方式 / Recognition fallback'),
    ).toHaveValue('482913')
    expect(screen.getByText('Code detected')).toBeInTheDocument()
    expect(screen.getByLabelText('Detected sound code')).toBeInTheDocument()
    expect(screen.getAllByTestId('detected-digit').map((slot) => slot.textContent)).toEqual([
      '4', '8', '2', '9', '1', '3',
    ])
  })

  it('labels manual entry as fallback and completes the real claim client flow', async () => {
    const user = userEvent.setup()
    const connect = vi.fn().mockResolvedValue({
      address: '0x3333333333333333333333333333333333333333',
      ethereum: {},
    })
    const requestVoucher = vi.fn().mockResolvedValue({
      signature: `0x${'ab'.repeat(65)}`,
      voucher: { validUntil: BigInt(Math.floor(Date.now() / 1000) + 90) },
    })
    const submit = vi.fn().mockResolvedValue({
      hash: `0x${'66'.repeat(32)}`,
      transactionUrl: `https://testnet.monadscan.com/tx/0x${'66'.repeat(32)}`,
    })
    render(
      <ClaimView
        config={publicConfig}
        connect={connect}
        createWriter={vi.fn().mockResolvedValue({})}
        ethereum={{}}
        issueVoucher={requestVoucher}
        submit={submit}
      />,
    )

    expect(
      screen.getByLabelText('识别备用方式 / Recognition fallback'),
    ).toBeInTheDocument()
    await user.type(
      screen.getByLabelText('识别备用方式 / Recognition fallback'),
      '482913',
    )
    await user.click(screen.getByRole('button', { name: 'Connect wallet' }))
    await user.click(screen.getByRole('button', { name: 'Get 90-second voucher' }))
    expect(await screen.findByText(/Voucher expires in/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Claim on Monad' }))
    expect(await screen.findByRole('link', { name: 'View transaction' })).toHaveAttribute(
      'href',
      expect.stringContaining('testnet.monadscan.com/tx/'),
    )
    expect(requestVoucher).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ code: '482913', chainId: 10_143 }),
    )
  })
})
