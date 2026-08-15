# EchoPass

**听见现场，领取凭证。**  
**Hear the moment. Prove you were there.**

EchoPass turns a rotating six-digit sound challenge into a wallet-bound voucher that expires after 90 seconds. The attendee submits that voucher to Monad Testnet, the contract records one credential per event and wallet, and anyone can verify the result onchain.

## Demo loop

1. Host unlocks the protected Host view and plays the current 30-second DTMF challenge.
2. Claim detects the sound through the microphone or uses the clearly labelled `识别备用方式 / Recognition fallback`.
3. The same-origin server validates the code and returns a 90-second voucher bound to chain, contract, event, claimant, signal hash, and expiry.
4. The connected wallet submits a real Monad Testnet `claim` transaction.
5. Verify reads `hasClaimed` from the deployed contract; a second claim by the same wallet is rejected.

Sound provides practical anti-sharing friction, not absolute proof of physical location.

## Architecture

- React 19 + Vite public SPA with Host, Claim, and Verify views.
- Ethers 6 injected-wallet and read-only RPC clients.
- Vercel functions:
  - `GET /api/challenge`, protected by a Host access token, derives the current sound code without exposing the event secret.
  - `POST /api/voucher`, validates the current/previous code and signs the canonical voucher digest.
- Solidity `EchoPass` contract compiled with `solc 0.8.28`, `evmVersion: prague`.
- Monad Testnet chain ID `10143`, RPC `https://testnet-rpc.monad.xyz`, explorer `https://testnet.monadscan.com`.

No private key, event secret, or Host access token belongs in browser code. The signing key is a disposable testnet key stored only in Vercel server environment variables.

## Local development

```bash
npm install
npm test
npm run test:contract
npm run build
npm run dev
```

Copy `.env.example` to `.env` locally. Populate values outside Git and never paste private keys or seed phrases into chat, issues, logs, screenshots, or commits.

Public browser variables:

- `VITE_CONTRACT_ADDRESS`
- `VITE_EVENT_ID`
- `VITE_EVENT_NAME`

Server-only variables:

- `ECHOPASS_CONTRACT_ADDRESS`
- `ECHOPASS_EVENT_ID`
- `ECHOPASS_CHAIN_ID=10143`
- `EVENT_CODE_SECRET`
- `HOST_ACCESS_TOKEN`
- `VOUCHER_SIGNER_PRIVATE_KEY`

Contract deployment additionally reads `MONAD_PRIVATE_KEY`, `VOUCHER_SIGNER`, and optionally `MONAD_TESTNET_RPC_URL`. Configure them only in the local process or deployment platform.

## Verified local baseline

- Vitest: 43 tests passing across domain, audio, API, wallet, contract client, and React views.
- Hardhat: 20 contract tests passing, including ABI parity and replay/budget/rollback coverage.
- Production TypeScript/Vite build passing.

## Public deployment evidence

These values are intentionally not invented. They will be filled after observed deployment and verification:

- Contract address: pending deployment
- Deployment transaction: pending deployment
- Successful claim transaction: pending real-device claim
- Public frontend: pending deployment
- Public GitHub repository: pending publication

The five-minute live flow and backup capture list are in [`docs/DEMO_RUNBOOK.md`](docs/DEMO_RUNBOOK.md).

## Security boundary

- The voucher private key is read only inside `api/voucher.ts` request handling.
- The event code secret is read only by server functions.
- Host access is independent of the event secret and remains only in Host component memory.
- Voucher signatures bind chain ID, contract, event, claimant, signal hash, and expiry.
- The contract rejects malformed/high-s signatures, expired vouchers, cross-wallet/cross-chain/cross-contract replay, and duplicate claims.
- Event reward budgets are isolated and reward-transfer failures roll back claim state atomically.

## Assets

- Logo: [`public/assets/echopass-mark.svg`](public/assets/echopass-mark.svg)
- Submission preview: [`public/assets/echopass-preview.png`](public/assets/echopass-preview.png)
