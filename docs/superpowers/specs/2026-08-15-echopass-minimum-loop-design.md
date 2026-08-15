# EchoPass Minimum Loop Design

## Scope and priorities

EchoPass ships one judge-visible Monad Testnet loop: a host presents a rotating audible challenge, an attendee exchanges the detected or manually entered fallback code for a 90-second wallet-bound voucher, the attendee claims through the deployed contract, and Verify reads the resulting onchain credential. Duplicate claims must fail. Work is ordered as follows:

1. Real Monad Testnet claim and verification loop.
2. Complete Host, Claim, and Verify experience.
3. Automatic microphone recognition.
4. Visual refinement.

There is no indexer, account abstraction, Para integration, x402, EIP-7702, admin dashboard, or simulated judge path in this scope. Manual entry remains available and is always labelled `识别备用方式 / Recognition fallback`.

## Runtime architecture

The application is a React 19 SPA built by Vite and deployed with Vercel. Ethers 6 provides injected-wallet access, read-only Monad Testnet RPC access, contract calls, event queries, and transaction links. The application has three routes represented by URL query state so a refresh or copied demo link preserves the active Host, Claim, or Verify view without introducing a routing framework.

The Vercel function at `api/voucher.ts` is the only signing boundary. Pure request validation and voucher issuance live in focused server modules under `api/lib/`, allowing Vitest to exercise real validation and signing without starting Vercel. The function reads secrets only when handling a request; no private value is exported, serialized, logged, embedded in Vite variables, or included in test snapshots. A separate `api/challenge.ts` derives the Host code server-side and requires an independent `HOST_ACCESS_TOKEN`; the Host operator enters that token before the demo and it remains only in React memory. This keeps `EVENT_CODE_SECRET` out of browser assets without turning the current rotating code into an unauthenticated public API.

Shared public configuration includes chain ID `10143`, RPC `https://testnet-rpc.monad.xyz`, explorer `https://testnet.monadscan.com`, deployed contract address, event ID, and event display name. Browser-exposed values use the `VITE_` prefix. Server allow-list values do not contain secrets. The disposable voucher signer private key is stored only as `VOUCHER_SIGNER_PRIVATE_KEY` in Vercel and local `.env`, both ignored by Git. `.env.example` contains names and safe public defaults only.

## Voucher protocol

The client POSTs JSON containing `eventId`, `code`, `claimant`, `contractAddress`, and `chainId`. The server:

1. Rejects non-POST methods, malformed JSON, unknown fields with invalid types, malformed addresses and bytes32 values, unsupported chain or contract, and requests exceeding the rate limit.
2. Derives current and previous 30-second codes from `EVENT_CODE_SECRET` and the allow-listed event ID.
3. Compares codes without exposing the expected value.
4. Sets `validUntil` to the current Unix time plus exactly 90 seconds.
5. Computes `signalHash` from a documented stable UTF-8 message containing the event ID and accepted six-digit code.
6. Signs the existing canonical voucher digest with Ethers `signMessage(getBytes(digest))`.
7. Returns only the public voucher fields and signature.

Rate limiting is an in-memory, per-IP sliding window suitable for the minimum serverless demo boundary. It limits accidental and basic automated abuse but is not described as durable distributed rate limiting. The response uses `429` with a generic retry message when exceeded.

## Host view

Host first accepts the private Host access token, then displays the frozen event name, current six-digit code returned by the protected challenge endpoint, seconds remaining in the 30-second slot, a prominent Play Sound button using the existing DTMF transport, live onchain claim count derived from `PresenceClaimed` logs, and the deployed contract address. The token is never persisted. If required public or server configuration is missing, Host shows a deployment-configuration error rather than simulated data.

## Claim view

Claim presents microphone recognition first and the explicitly labelled manual fallback second. Automatic recognition captures microphone audio, detects DTMF pairs in time windows, and assembles six digits; if microphone permission, browser APIs, or room acoustics fail, the user can immediately use the fallback.

The wallet button requests an injected EIP-1193 account and requires chain ID `10143`, offering a switch/add-network action when needed. Once code and wallet are present, Claim requests a voucher, shows its 90-second countdown, estimates the real `claim` transaction gas, applies at most a 10% buffer, submits through the wallet, waits for confirmation, and shows the explorer link. Before submission it reads `hasClaimed`; an existing credential produces a clear duplicate state. Contract reverts are translated into concise user states without claiming a centralized success.

## Verify view

Verify accepts an event ID and wallet address, validates both locally, then calls `hasClaimed` on Monad Testnet. It shows true/false, the configured contract address, and an explorer link. When a successful claim transaction is present in the current session, it also shows that transaction link. Verification never relies on local storage as the source of truth.

## Error and security behavior

The UI distinguishes configuration, wallet, network, voucher, expiry, rejection, and RPC errors. It never includes environment-variable values, raw server exceptions, or signer details. The API logs no request body and returns stable public error codes. CORS is same-origin by default. Payload size and JSON shape are bounded before cryptographic work.

No secret may appear in `src/`, `public/`, `dist/`, committed `.env` files, Git history, logs, fixtures, snapshots, README examples, or deployment metadata. Tests create ephemeral random wallets in memory and never print their private keys.

## Testing strategy

All new behavior follows strict RED → GREEN → REFACTOR:

- Pure server tests prove malformed input, allow-list enforcement, current/previous code acceptance, 90-second expiry, signature recovery, and rate limiting.
- Wallet/contract client tests prove network enforcement, voucher payload construction, claim submission, gas-buffer bounds, duplicate reads, and explorer URLs using narrow EIP-1193/RPC fakes at the external boundary.
- React Testing Library tests exercise real Host, Claim, and Verify components, accessible labels, fallback wording, state transitions, and error presentation.
- Existing code, tone, voucher, ABI parity, and Solidity tests remain unchanged except for compatibility corrections already committed.
- Production build, secret scanning, and Git status checks form the acceptance gate.

Automatic audio recognition is implemented only after the real manual-fallback claim path is green. Visual refinement follows functional and accessibility acceptance.

## Deployment and evidence

The contract deploys to Monad Testnet using the existing Hardhat configuration and a disposable deployer configured outside chat. Verification uses the MONSKILLS verification API first and official explorer fallback only if needed. The public Vercel deployment receives server-only signing variables through platform configuration and safe public variables separately.

README and submission copy record the verified contract, deployment transaction, successful claim transaction, public frontend, GitHub repository, and explorer URLs. Final evidence follows `docs/DEMO_RUNBOOK.md`: seven screenshots and one uninterrupted 45–60 second local video, with the real explorer transaction visible.
