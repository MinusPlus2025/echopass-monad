import { useEffect, useState } from 'react'
import type { Eip1193Provider } from 'ethers'

import { listenForCode } from '../audio/listen.js'
import type { PublicConfig } from '../config.js'
import type { ClientVoucherResponse, Fetcher } from '../voucher/client.js'
import type { ClaimWriter, ConnectedWallet } from '../wallet/client.js'

interface ClaimViewProps {
  config: PublicConfig
  connect(ethereum: Eip1193Provider): Promise<ConnectedWallet>
  createWriter(wallet: ConnectedWallet, contractAddress: string): Promise<ClaimWriter>
  ethereum: unknown
  issueVoucher(
    fetcher: Fetcher,
    request: {
      chainId: number
      claimant: string
      code: string
      contractAddress: string
      eventId: string
    },
  ): Promise<ClientVoucherResponse>
  listen?(): Promise<string>
  submit(
    writer: ClaimWriter,
    voucher: ClientVoucherResponse,
  ): Promise<{ hash: string; transactionUrl: string }>
}

export function ClaimView(props: ClaimViewProps) {
  const [code, setCode] = useState('')
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null)
  const [writer, setWriter] = useState<ClaimWriter | null>(null)
  const [voucher, setVoucher] = useState<ClientVoucherResponse | null>(null)
  const [transactionUrl, setTransactionUrl] = useState('')
  const [status, setStatus] = useState('Ready')
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1_000))

  const listen = async () => {
    try {
      setStatus('Listening for code')
      setCode(await (props.listen ?? listenForCode)())
      setStatus('Code detected')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Recognition failed')
    }
  }

  useEffect(() => {
    if (!voucher) return
    const timer = window.setInterval(
      () => setNow(Math.floor(Date.now() / 1_000)),
      1_000,
    )
    return () => window.clearInterval(timer)
  }, [voucher])

  const connect = async () => {
    try {
      setStatus('Connecting wallet')
      const nextWallet = await props.connect(props.ethereum as Eip1193Provider)
      setWallet(nextWallet)
      setWriter(await props.createWriter(nextWallet, props.config.contractAddress))
      setStatus('Wallet connected')
    } catch {
      setStatus('Wallet connection failed')
    }
  }

  const getVoucher = async () => {
    if (!wallet || !/^\d{6}$/.test(code)) return
    try {
      setStatus('Requesting voucher')
      const nextVoucher = await props.issueVoucher(fetch as unknown as Fetcher, {
        chainId: props.config.chainId,
        claimant: wallet.address,
        code,
        contractAddress: props.config.contractAddress,
        eventId: props.config.eventId,
      })
      setVoucher(nextVoucher)
      setNow(Math.floor(Date.now() / 1_000))
      setStatus('Voucher ready')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Voucher request failed')
    }
  }

  const claim = async () => {
    if (!writer || !voucher) return
    try {
      setStatus('Submitting Monad transaction')
      const result = await props.submit(writer, voucher)
      setTransactionUrl(result.transactionUrl)
      setStatus('Claim confirmed')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Claim rejected')
    }
  }

  const remaining = voucher
    ? Math.max(0, Number(voucher.voucher.validUntil) - now)
    : 0

  return (
    <section>
      <h1>Claim your EchoPass</h1>
      <p>Listen for the Host sound, then connect your wallet.</p>
      <button onClick={listen} type="button">
        Listen for code
      </button>
      <label>
        识别备用方式 / Recognition fallback
        <input
          inputMode="numeric"
          maxLength={6}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          value={code}
        />
      </label>
      <button onClick={connect} type="button">
        Connect wallet
      </button>
      <button
        disabled={!wallet || !/^\d{6}$/.test(code)}
        onClick={getVoucher}
        type="button"
      >
        Get 90-second voucher
      </button>
      {voucher && <p>Voucher expires in {remaining} seconds</p>}
      <button disabled={!voucher || remaining === 0} onClick={claim} type="button">
        Claim on Monad
      </button>
      <p aria-live="polite">{status}</p>
      {transactionUrl && <a href={transactionUrl}>View transaction</a>}
    </section>
  )
}
