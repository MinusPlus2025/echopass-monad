# EchoPass — Codex Client Handoff (2026-08-15)

## Goal and deadline

Finish and submit an original Monad Blitz project today. The public demo must show this real loop on Monad Testnet:

**Host plays rotating sound code → attendee obtains a 90-second wallet-bound voucher → attendee sends a Monad claim transaction → Verify shows the credential → duplicate claim is rejected.**

Do not expand scope until this loop is deployed, tested, and recorded.

## Product identity

- Team: `耳听为实｜Ear Witness`
- Project: `EchoPass`
- Chinese tagline: `听见现场，领取凭证`
- English tagline: `Hear the moment. Prove you were there.`

## Competition constraints

- Original project; do not fork an existing repository.
- All implementation commits must remain within the Blitz window.
- Public GitHub repository required.
- Contract must be deployed and running on Monad.
- Frontend must be publicly accessible and remain live.
- Submission needs logo, preview image, concise description, frontend URL, and GitHub URL.
- Five-minute presentation must center on a real Monad Testnet demo.

## Completed and committed

### Product and submission

- Frozen product direction and client handoff: `docs/CODEX_HANDOFF.md`
- Chinese/English MOJO copy and commercial model: `docs/SUBMISSION_DRAFT.md`
- Exact five-minute live-demo sequence and backup checklist: `docs/DEMO_RUNBOOK.md`
- Official Monad deployment/resource decisions: `docs/OFFICIAL_MONAD_RESOURCES.md`
- Logo mark: `public/assets/echopass-mark.svg`
- MOJO preview image: `public/assets/echopass-preview.png`

### Rotating code domain

- `src/domain/code.ts`
- `test/code.test.ts`
- SHA-256-derived six-digit code, 30-second slots, current/previous slot acceptance.
- Independently reviewed: passed, with only a deferred exact rollover-boundary test.

### Audible transport

- `src/audio/tone.ts`
- `test/tone.test.ts`
- Standard DTMF digit mapping, ±25 Hz detector, sequential Web Audio playback.
- Independently reviewed: passed, with only deferred exact ±25/±26 boundary assertions.

### Monad contract source

- `contracts/EchoPass.sol`
- `contracts/test/EchoPass.ts`
- `contracts/test/RejectingClaimant.sol`
- `src/domain/voucher.ts`
- `test/voucher.test.ts`
- `src/contract/abi.ts`
- `hardhat.config.ts`
- `scripts/deploy.ts`

Implemented contract behavior:

- organizer-only event creation;
- immutable authorized voucher signer;
- digest bound to chain ID, contract, event, claimant, signal hash, and expiry;
- EIP-191 recovery with low-`s` and `v` checks;
- one wallet claim per event;
- event-scoped reward budgets so events cannot consume each other's MON;
- atomic reward transfer rollback;
- organizer recovery of remaining event funds after event end;
- ABI parity test source.

Important: this contract source is **not yet accepted as passing**. The Work sandbox could not install Hardhat/Ethers, so compile, contract tests, voucher tests, and generated ABI parity remain unexecuted.

## Verified evidence

- Existing code/tone tests: 7/7 passed in the Work environment.
- Vite build passed before the Ethers/Hardhat dependency declarations were added.
- Contract source security review found no Critical issue after source fixes, but acceptance remains blocked until the full suite runs.

## Not completed

### 1. Install and route MONSKILLS locally

Open `https://skills.devnads.com/install.md` and run:

```bash
npx skills add therealharpaljadeja/monskills
```

Then start with local `monskill`. For this project it should route only to the topics needed now: `scaffold`, `concepts`, `gas`, `addresses`, and `tooling-and-infra`. Do not add indexers, x402, EIP-7702, or Para unless the core demo is already complete.

The upstream installer may report a YAML parse error for the optional `wallet` skill. Do not block the project on that skill; use the official Remix or Hardhat deployment path.

### 2. Restore dependencies and regenerate the lockfile

`package.json` declares Hardhat/Ethers packages, but `package-lock.json` is stale.

Run:

```bash
npm install
npm test
npm run test:contract
npm run build
```

Do not claim completion until all four commands exit 0. Fix actual source/config incompatibilities instead of weakening tests.

Monad configuration must remain:

- Solidity compiler `0.8.28`
- EVM version `prague`
- Testnet chain ID `10143`
- RPC `https://testnet-rpc.monad.xyz`
- Explorer `https://testnet.monadscan.com`

### 3. Complete the frontend

Missing files include `src/main.tsx`, `src/App.tsx`, `src/styles.css`, and UI tests.

Build one responsive public SPA with three views:

1. **Host** — event name, rotating six-digit code, 30-second countdown, Play Sound, live claim count.
2. **Claim** — microphone listening, clearly labelled manual fallback, detected code, connect wallet, voucher state, Monad submit state, confirmed/rejected state.
3. **Verify** — event + wallet lookup, `hasClaimed`, contract address, transaction/explorer link.

The judge-visible path must use the real deployed contract. A simulated/demo state may exist only as a clearly labelled fallback.

### 4. Add a secure voucher endpoint

Never put the voucher signer private key in browser code.

Implement a minimal Vercel serverless endpoint such as `api/voucher.ts` that:

- receives event ID, rotating code, claimant wallet, contract address, and chain ID;
- validates the current or previous 30-second code using a server-only event secret;
- creates a 90-second `validUntil`;
- hashes the audible signal/code;
- signs the exact voucher digest with a server-only disposable testnet signer;
- returns voucher fields and signature;
- rejects malformed addresses, wrong codes, unsupported chain/contract, and excessive requests.

Environment variables must never be committed. Provide `.env.example` with names only.

### 5. Deploy and verify

Preferred path after tests pass: Hardhat deployment and verification.

Fallback if local tooling fails: official Remix guide in `docs/OFFICIAL_MONAD_RESOURCES.md`.

Use only a disposable testnet wallet. Never request or paste a seed phrase/private key into chat. Configure secrets locally or in the deployment platform.

Record:

- contract address;
- deployment transaction URL;
- one successful claim transaction URL;
- public frontend URL;
- public GitHub URL.

### 6. Publish and rehearse

- Create an empty public GitHub repo named `echopass-monad` under `MinusPlus2025`.
- Push the existing Git history; do not squash it because commit timestamps evidence Blitz-period work.
- Deploy the frontend publicly.
- Follow `docs/DEMO_RUNBOOK.md`.
- Capture seven backup screenshots and a 45–60 second uninterrupted demo video.
- Fill the final URLs into README and MOJO.

## Required acceptance gate

Before submission, independently verify:

```bash
npm test
npm run test:contract
npm run build
git status --short
```

Then manually verify on the public deployment:

- sound plays;
- microphone or manual fallback obtains a valid challenge;
- connected wallet receives a 90-second voucher;
- real Monad claim confirms;
- explorer link opens the correct transaction;
- Verify returns true for the claimed wallet/event;
- second claim fails;
- another wallet cannot reuse the first wallet's voucher;
- no secret exists in frontend assets or Git history.

## Exact Codex client starter prompt

Paste this into Codex after opening the extracted repository:

> Read `docs/CODEX_CLIENT_HANDOFF.md` completely, then inspect the current Git branch and existing reports. Install MONSKILLS from `https://skills.devnads.com/install.md`, start with the local `monskill` router, and load only the topic skills relevant to finishing EchoPass. Preserve the frozen scope and existing Git history. First restore dependencies and make all existing domain, voucher, ABI, and Solidity tests pass. Then use strict TDD to build the Host/Claim/Verify frontend and a server-only 90-second voucher endpoint. Deploy the contract to Monad Testnet, verify it, deploy the public frontend, update README with all URLs, run the full acceptance gate, and prepare the screenshot/video backup described in `docs/DEMO_RUNBOOK.md`. Never ask for or expose a seed phrase/private key; stop only when a user-driven wallet or external account action is required.
