# EchoPass — Codex Client Handoff

## Mission

Ship an original Monad Blitz MVP in the remaining three-hour window:

> Hear a rotating six-digit sound code at a physical event, bind the short-lived proof to a wallet, claim a one-time credential on Monad, and verify it publicly.

The judge-visible loop is **Host / Broadcast → Claim → Monad transaction → Verify → duplicate rejection**.

## Frozen scope

- Audible DTMF-like six-digit code rotating every 30 seconds.
- Browser sound playback and microphone-oriented decoder, with a manual code fallback for noisy demo conditions.
- Voucher valid for 90 seconds and bound to chain, contract, event, claimant wallet, signal hash, and expiry.
- Solidity contract deployed on Monad testnet.
- One claim per wallet per event and optional MON reward.
- Responsive public SPA with Host, Claim, and Verify views.
- Public GitHub, public frontend, README, contract address, explorer link, and five-minute demo script.

Do not add NFT standards, KYC, GPS, ultrasonic protocols, ticketing, multi-chain support, an admin dashboard, or strong anti-relay claims.

## Current repository state

Task 1 is implemented with TDD on branch `feat/echopass-mvp`:

- `src/domain/code.ts`
- `test/code.test.ts`
- Vite/TypeScript/Vitest baseline

Run before continuing:

```bash
npm install
npm test
npm run build
```

## Development order

### 1. Audible transport

Write failing tests first for:

- `frequenciesForDigit('5')` returns `[770, 1336]`.
- `detectDigit([772, 1334])` returns `'5'` with ±25 Hz tolerance.
- Unsupported characters throw `Unsupported digit`.

Then implement `src/audio/tone.ts` with standard DTMF digit pairs and `playCode()` using Web Audio oscillators.

### 2. Monad contract and voucher

Write failing contract tests first for successful claim, duplicate rejection, expiry rejection, and wallet binding. Implement:

```solidity
createEvent(bytes32 eventId, uint64 endsAt, uint96 rewardPerClaim)
claim(bytes32 eventId, uint64 validUntil, bytes32 signalHash, bytes signature)
hasClaimed(bytes32 eventId, address attendee)
```

The signed digest field order is:

```solidity
keccak256(abi.encode(block.chainid, address(this), eventId, msg.sender, signalHash, validUntil))
```

Emit `PresenceClaimed(bytes32 indexed eventId, address indexed attendee, uint256 reward)`.

### 3. Product integration

Write a failing UI test before `src/App.tsx`. Implement three views:

- Host: rotating code, 30-second countdown, Play sound, live claim count.
- Claim: listen/manual fallback, code detected state, connect wallet, submit, confirmed/rejected state.
- Verify: event and wallet lookup, credential status, transaction/explorer link.

Use a deterministic demo mode only as a fallback; label it clearly. Preserve the real contract ABI and transaction path.

### 4. Verification and deployment

Before claiming completion, run fresh:

```bash
npm test
npm run test:contract
npm run build
```

Deploy contract to Monad testnet, set public environment variables, deploy the frontend, then record these exact outputs in README:

- Public GitHub URL
- Public frontend URL
- Contract address
- Monad explorer URL
- One successful claim transaction

## Commit discipline

- Work only on `feat/echopass-mvp` until verified.
- Keep core code commits within the Blitz window.
- Commit after each green TDD slice.
- Never commit `.env`, private keys, seed phrases, or deployment secrets.
- Use a new disposable testnet deployer key and obtain only test MON.

## Codex client starter prompt

Paste this after opening the cloned repository:

> Read `docs/CODEX_HANDOFF.md` completely. Continue from the current branch and execute Development order sections 1–4. Use strict TDD: write one failing behavior test, run it and confirm the expected failure, implement the minimum code, then rerun the focused test and full relevant suite. Do not expand the frozen scope. Commit each verified slice. Stop only for missing Monad deployment credentials or a real external access blocker, and never ask for a seed phrase.
