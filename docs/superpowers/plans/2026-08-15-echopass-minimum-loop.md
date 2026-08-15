# EchoPass Minimum Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver and publicly demonstrate the real Host sound challenge → 90-second wallet voucher → Monad Testnet claim → Verify credential → duplicate rejection loop.

**Architecture:** A React/Vite SPA calls a same-origin Vercel function for vouchers and Ethers 6 for injected-wallet and read-only Monad RPC access. Pure client/server modules isolate configuration, validation, signing, contract calls, and audio recognition so each behavior can be driven by focused tests before UI composition.

**Tech Stack:** React 19, Vite 7, TypeScript 5, Ethers 6, Vercel Node functions, Vitest, React Testing Library, Hardhat 3, Solidity 0.8.28/prague.

## Global Constraints

- Priority order: real Monad Testnet loop, complete Host/Claim/Verify experience, automatic recognition, visual refinement.
- Chain ID remains `10143`, compiler remains `0.8.28`, EVM target remains `prague`, default RPC remains `https://testnet-rpc.monad.xyz`, and explorer remains `https://testnet.monadscan.com`.
- Manual code input is always labelled `识别备用方式 / Recognition fallback`.
- `VOUCHER_SIGNER_PRIVATE_KEY` and `EVENT_CODE_SECRET` exist only in server environment variables; never browser code, Git, output, logs, fixtures, or snapshots.
- Existing `.superpowers/sdd/2026-08-15-echopass-mvp/task-{1,2,3}-report.md` deletion states remain unstaged and uncommitted.
- No Para, indexer, x402, EIP-7702, simulated judge success, or scope expansion.
- Every behavior change follows observed RED, minimal GREEN, then REFACTOR with all relevant suites green.

---

### Task 1: React test and runtime baseline

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Modify: `vite.config.ts`
- Modify: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `test/setup.ts`
- Create: `test/app-shell.test.tsx`

**Interfaces:**
- Produces: `App(): JSX.Element`, a three-tab shell with `host | claim | verify` URL query state.

- [ ] **Step 1: Install the exact UI/test dependencies**

Run: `npm install react react-dom && npm install -D @types/react @types/react-dom @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`

- [ ] **Step 2: Write the failing shell test**

Create `test/app-shell.test.tsx` that renders `App`, asserts accessible tabs named `Host`, `Claim`, and `Verify`, clicks Claim, and asserts `window.location.search === '?view=claim'` plus the Claim heading.

- [ ] **Step 3: Verify RED**

Run: `npm test -- test/app-shell.test.tsx`
Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 4: Add the minimal React baseline**

Configure Vite React and Vitest jsdom/setup, add `jsx: react-jsx`, mount `<App />` from `src/main.tsx`, and implement only the accessible three-tab shell and query-state selection.

- [ ] **Step 5: Verify GREEN and refactor**

Run: `npm test -- test/app-shell.test.tsx && npm run build`
Expected: shell test passes and Vite builds the React entry.

- [ ] **Step 6: Commit**

Run: `git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/main.tsx src/App.tsx test/setup.ts test/app-shell.test.tsx && git commit -m "feat: add EchoPass React shell"`

### Task 2: Public configuration and read-only contract client

**Files:**
- Create: `src/config.ts`
- Create: `src/contract/client.ts`
- Create: `test/config.test.ts`
- Create: `test/contract-client.test.ts`
- Create: `.env.example`

**Interfaces:**
- Produces: `loadPublicConfig(env): PublicConfig`, `explorerAddressUrl(address)`, `explorerTxUrl(hash)`, `hasClaimed(config, eventId, claimant, provider?)`, `claimCount(config, eventId, provider?)`.

- [ ] **Step 1: Write failing configuration tests**

Test literal defaults for chain/RPC/explorer, rejection of missing or malformed `VITE_CONTRACT_ADDRESS` and `VITE_EVENT_ID`, and exact explorer URL encoding. Assert `.env.example` behavior indirectly by loading the same safe public variable shape, never by grepping prose.

- [ ] **Step 2: Verify RED**

Run: `npm test -- test/config.test.ts`
Expected: FAIL because `src/config.ts` does not exist.

- [ ] **Step 3: Implement minimal validated public config**

Use Ethers `isAddress` and `isHexString(value, 32)`; export typed immutable values without any secret names or values.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- test/config.test.ts`
Expected: configuration tests pass.

- [ ] **Step 5: Write failing read-client tests**

Use a narrow injected `ContractReader` fake returning literal boolean/log arrays. Prove the exact event/wallet arguments, count only the configured event, and generate exact Monadscan links.

- [ ] **Step 6: Verify RED, implement, and verify GREEN**

Run before implementation: `npm test -- test/contract-client.test.ts`
Expected: FAIL because `src/contract/client.ts` does not exist.

Implement an Ethers `JsonRpcProvider` default with injectable test boundary, then run: `npm test -- test/config.test.ts test/contract-client.test.ts`.

- [ ] **Step 7: Commit**

Run: `git add src/config.ts src/contract/client.ts test/config.test.ts test/contract-client.test.ts .env.example && git commit -m "feat: add Monad public contract client"`

### Task 3: Server-only voucher endpoint

**Files:**
- Create: `api/lib/config.ts`
- Create: `api/lib/rate-limit.ts`
- Create: `api/lib/voucher-service.ts`
- Create: `api/voucher.ts`
- Create: `test/api-voucher.test.ts`
- Modify: `tsconfig.json`

**Interfaces:**
- Produces: `issueVoucher(input, context): Promise<VoucherResponse>`, `voucherHandler(request, response)`, and `createRateLimiter({limit, windowMs, now})`.
- Consumes: existing `acceptedCodes`, `Voucher`, `voucherDigest`, and Ethers `Wallet`.

- [ ] **Step 1: Write failing service tests**

Test invalid JSON shape, invalid claimant/contract/event, wrong chain, wrong contract, wrong code, current code, previous code, exact `now + 90` expiry, stable `signalHash`, and recovered signer address. Use `Wallet.createRandom()` only in memory and never print or snapshot it.

- [ ] **Step 2: Verify RED**

Run: `npm test -- test/api-voucher.test.ts`
Expected: FAIL because `api/lib/voucher-service.ts` does not exist.

- [ ] **Step 3: Implement minimal server config and voucher service**

Read `VOUCHER_SIGNER_PRIVATE_KEY`, `EVENT_CODE_SECRET`, `ECHOPASS_CONTRACT_ADDRESS`, `ECHOPASS_EVENT_ID`, and optional `ECHOPASS_CHAIN_ID` inside request handling. Validate before constructing `Wallet`; return stable public error codes without secret-bearing messages.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- test/api-voucher.test.ts`
Expected: service tests pass including signer recovery and 90-second boundary.

- [ ] **Step 5: Write failing handler and rate-limit tests**

Exercise real handler request/response fakes for method rejection, body size/type rejection, success JSON, generic 400/403/429/500 responses, and a per-IP limit whose next request succeeds after the literal window elapses.

- [ ] **Step 6: Verify RED, implement, and verify GREEN**

Run the new focused tests, confirm failure for absent handler/limiter behavior, implement the bounded JSON handler and in-memory limiter, then run `npm test -- test/api-voucher.test.ts`.

- [ ] **Step 7: Secret boundary check and commit**

Run: `git diff --check && rg -n "VOUCHER_SIGNER_PRIVATE_KEY|EVENT_CODE_SECRET" src public test --glob '!*.md'`
Expected: no browser/public/test occurrence.

Run: `git add api tsconfig.json test/api-voucher.test.ts .env.example && git commit -m "feat: issue server-only claim vouchers"`

### Task 4: Real wallet and claim transaction client

**Files:**
- Create: `src/wallet/client.ts`
- Create: `src/voucher/client.ts`
- Create: `test/wallet-client.test.ts`
- Create: `test/voucher-client.test.ts`

**Interfaces:**
- Produces: `connectMonadWallet(ethereum): Promise<ConnectedWallet>`, `requestVoucher(fetch, request): Promise<VoucherResponse>`, `submitClaim(wallet, voucher): Promise<ClaimResult>`, `estimateClaimGas(...)` capped to a 10% buffer.

- [ ] **Step 1: Write failing wallet tests**

With a complete EIP-1193 fake, prove account request, chain `0x279f` enforcement, `wallet_switchEthereumChain`, `wallet_addEthereumChain` fallback, account normalization, duplicate `hasClaimed` preflight, exact four claim arguments, gas estimate plus at most 10%, receipt wait, rejection propagation, and explorer transaction URL.

- [ ] **Step 2: Verify RED**

Run: `npm test -- test/wallet-client.test.ts`
Expected: FAIL because `src/wallet/client.ts` does not exist.

- [ ] **Step 3: Implement minimal wallet and claim client**

Use `BrowserProvider`, injected dependencies for tests, and no persistence of accounts, signatures, or vouchers outside React state.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- test/wallet-client.test.ts`
Expected: all wallet/network/claim behaviors pass.

- [ ] **Step 5: Write failing voucher HTTP tests, implement, and verify**

Prove request JSON shape, non-2xx public errors, malformed response rejection, and valid bigint conversion. Run RED before creating `src/voucher/client.ts`, then GREEN with `npm test -- test/voucher-client.test.ts`.

- [ ] **Step 6: Commit**

Run: `git add src/wallet/client.ts src/voucher/client.ts test/wallet-client.test.ts test/voucher-client.test.ts && git commit -m "feat: add real Monad claim client"`

### Task 5: Host, manual Claim, and Verify functional views

**Files:**
- Create: `src/views/HostView.tsx`
- Create: `src/views/ClaimView.tsx`
- Create: `src/views/VerifyView.tsx`
- Create: `test/host-view.test.tsx`
- Create: `test/claim-view.test.tsx`
- Create: `test/verify-view.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes Tasks 2–4 clients and existing `deriveCode`, `playCode`.
- Produces the complete real manual-fallback demo path before microphone work.
- Host obtains its rotating code from the `HOST_ACCESS_TOKEN`-protected `/api/challenge` endpoint so `EVENT_CODE_SECRET` never enters browser assets; the access token remains in component memory only.

- [ ] **Step 1: Write and run Host RED**

Test event name, six digits, countdown, Play Sound behavior, claim count, contract link, and configuration failure. Run `npm test -- test/host-view.test.tsx`; expect missing module failure.

- [ ] **Step 2: Implement Host GREEN and refactor**

Implement clock injection/timer cleanup and read-only claim count. Run the focused test until green.

- [ ] **Step 3: Write and run Claim RED**

Test the exact fallback label, six-digit validation, wallet connect/network state, voucher loading, visible 90-second countdown, real submit/pending/confirmed explorer link, duplicate state, expiry, and public error presentation. Run focused test and confirm missing behavior failure.

- [ ] **Step 4: Implement Claim GREEN and refactor**

Compose the real clients with injected props for external boundaries. Never expose simulated success. Run the focused test until green.

- [ ] **Step 5: Write and run Verify RED**

Test event/wallet validation, loading, onchain true/false results, contract link, and optional session transaction link. Confirm RED before implementation.

- [ ] **Step 6: Implement Verify GREEN and integrate App**

Render all three real views from the shell and run `npm test -- test/host-view.test.tsx test/claim-view.test.tsx test/verify-view.test.tsx test/app-shell.test.tsx`.

- [ ] **Step 7: Commit**

Run: `git add src/App.tsx src/views test/*-view.test.tsx && git commit -m "feat: complete EchoPass demo views"`

### Task 6: Automatic microphone recognition

**Files:**
- Create: `src/audio/listen.ts`
- Create: `test/listen.test.ts`
- Modify: `src/views/ClaimView.tsx`
- Modify: `test/claim-view.test.tsx`

**Interfaces:**
- Produces: `listenForCode(options): Promise<string>` using `getUserMedia`, `AnalyserNode`, the existing `detectDigit`, stable-frame debouncing, timeout, and cleanup.

- [ ] **Step 1: Write failing detector-pipeline tests**

Use deterministic analyser frames with literal DTMF frequencies to prove six ordered digits, repeated-frame debouncing, silence handling, timeout, permission rejection, and track/context cleanup.

- [ ] **Step 2: Verify RED**

Run: `npm test -- test/listen.test.ts`
Expected: FAIL because `src/audio/listen.ts` does not exist.

- [ ] **Step 3: Implement minimal recognition pipeline and verify GREEN**

Convert analyser bins to peak frequencies, require stable frames, append only digit transitions, stop at six digits, and always clean up in `finally`. Run the focused test.

- [ ] **Step 4: Add Claim microphone RED/GREEN**

Add a UI test for listen/loading/detected/error/fallback continuity, observe RED, wire `listenForCode`, then rerun Claim and listen tests.

- [ ] **Step 5: Commit**

Run: `git add src/audio/listen.ts src/views/ClaimView.tsx test/listen.test.ts test/claim-view.test.tsx && git commit -m "feat: detect audible EchoPass codes"`

### Task 7: Responsive visual system and accessibility

**Files:**
- Create: `src/styles.css`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/views/HostView.tsx`
- Modify: `src/views/ClaimView.tsx`
- Modify: `src/views/VerifyView.tsx`
- Modify: `test/app-shell.test.tsx`

**Interfaces:**
- Produces one responsive bilingual demo surface using the existing logo asset and functional states.

- [ ] **Step 1: Write failing accessibility behavior assertions**

Assert a skip link, single page heading, labelled status regions, keyboard-operable tabs, visible focus hooks, and no color-only state naming. Confirm the focused test fails for missing behavior.

- [ ] **Step 2: Implement minimal accessible structure and responsive CSS**

Use CSS custom properties, high contrast, large six-digit typography, mobile-first stacking, reduced-motion support, and the committed EchoPass SVG. Preserve all functional labels.

- [ ] **Step 3: Verify GREEN**

Run: `npm test -- test/app-shell.test.tsx test/host-view.test.tsx test/claim-view.test.tsx test/verify-view.test.tsx && npm run build`.

- [ ] **Step 4: Commit**

Run: `git add src test/app-shell.test.tsx && git commit -m "style: polish EchoPass live demo"`

### Task 8: Full local acceptance, documentation, and deployment readiness

**Files:**
- Create: `.monskills`
- Create or modify: `README.md`
- Modify: `docs/SUBMISSION_DRAFT.md`
- Modify: `docs/DEMO_RUNBOOK.md` only to insert actual evidence paths/URLs without changing the frozen script.
- Create: `vercel.json` only if Vercel routing requires it.

**Interfaces:**
- Produces deployable artifacts, exact environment-variable instructions, and URL/evidence slots filled only with observed values.

- [ ] **Step 1: Run full automated acceptance**

Run: `npm test && npm run test:contract && npm run build && git diff --check && git status --short`.
Expected: every suite exits 0; only the three protected report deletions may remain outside the current task diff.

- [ ] **Step 2: Run secret and bundle inspection**

Run targeted scans across tracked files, `dist/`, and commit history for secret variable values/patterns; inspect Vite output to confirm no server variable names or private keys. Any finding blocks deployment.

- [ ] **Step 3: Write deployment/readme data without invented URLs**

Document local commands, safe environment names, Monad Testnet configuration, architecture, demo flow, security boundary, and explorer link format. Add `.monskills` with `built-with=monskills` and `chain=monad-testnet`.

- [ ] **Step 4: Commit readiness docs**

Run: `git add .monskills README.md docs/SUBMISSION_DRAFT.md docs/DEMO_RUNBOOK.md` and, only when it exists, `git add vercel.json`; inspect `git diff --cached --name-status`, then run `git commit -m "docs: prepare EchoPass deployment"`.

### Task 9: Monad Testnet contract deployment and verification

**Files:**
- Modify: deployment record locations defined in Task 8 after real values exist.

**Interfaces:**
- Produces verified contract address, deployment transaction URL, created event, and funded demo state.

- [ ] **Step 1: Check deployment prerequisites without exposing secrets**

Check only whether `MONAD_PRIVATE_KEY` and `VOUCHER_SIGNER` are set, current testnet balance/address, and RPC chain ID. Never print secret values. If a user-controlled wallet/platform action is required, stop with the exact action requested.

- [ ] **Step 2: Deploy and validate bytecode**

Run `npm run deploy:monad`, capture address/transaction from safe command output, then call `eth_getCode` at `https://testnet-rpc.monad.xyz` and require non-empty bytecode.

- [ ] **Step 3: Verify source**

Generate standard JSON and metadata for Solidity `0.8.28`, submit the MONSKILLS verification API request, and confirm verification on the returned explorers. Use official Sourcify fallback only on an observed API failure.

- [ ] **Step 4: Create the demo event and record URLs**

Create the allow-listed event with a future end and test budget, respecting Monad's 10 MON EOA reserve behavior and tight gas estimates. Update safe public/server configuration and documentation with observed values.

- [ ] **Step 5: Commit deployment record**

Stage only the explicitly edited deployment-record files, inspect `git diff --cached --name-status` for secrets and protected deletions, then run `git commit -m "docs: record Monad testnet deployment"`.

### Task 10: Public deployment and real-device evidence

**Files:**
- Modify: `README.md`
- Modify: `docs/SUBMISSION_DRAFT.md`
- Add: local evidence under a documented ignored directory unless the user explicitly approves committing media.

**Interfaces:**
- Produces public frontend/GitHub URLs, successful and duplicate claim evidence, seven screenshots, and one uninterrupted 45–60 second video.

- [ ] **Step 1: Publish existing Git history**

Create/use `MinusPlus2025/echopass-monad`, push `feat/echopass-mvp` without squash or force, and confirm the public commit history.

- [ ] **Step 2: Configure and deploy Vercel**

Set server secrets through Vercel's secret environment UI/CLI input without echoing them. Set safe public values separately, deploy production, and verify the public URL returns the SPA and `/api/voucher` rejects invalid input safely.

- [ ] **Step 3: Execute the real loop**

On two real browser contexts, play sound, use microphone or labelled fallback, obtain a 90-second voucher, submit a Monad claim, open the explorer, verify true, reject duplicate claim, and prove a second wallet cannot reuse the first voucher.

- [ ] **Step 4: Capture runbook evidence**

Capture all seven named screenshots and one uninterrupted 45–60 second video. Keep sensitive wallet prompts cropped to public address/transaction information only.

- [ ] **Step 5: Final acceptance and URL commit**

Run the full automated gate again, inspect public production behavior, update all final URLs, scan staged content and history for secrets, then commit `docs: publish EchoPass demo evidence` without staging the protected report deletions.
