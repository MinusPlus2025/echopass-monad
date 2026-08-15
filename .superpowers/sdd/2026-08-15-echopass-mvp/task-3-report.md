# Task 3 report: Monad credential contract and voucher boundary

## Status

Implementation and test source are complete. Contract compilation and the new
test suites are **blocked** in this workspace because `hardhat` and `ethers` are
not installed, the npm cache is empty for those packages, and registry access is
denied by the execution policy. No passing claim is made for the Task 3 suites.

Implementation commit:

- `2318a2778c34c270db9ff6ab93b0e0cc9fd7d07d` — `feat: add EchoPass credential contract`

## Files

- `contracts/EchoPass.sol`
- `contracts/test/EchoPass.ts`
- `hardhat.config.ts`
- `scripts/deploy.ts`
- `src/contract/abi.ts`
- `src/domain/voucher.ts`
- `test/voucher.test.ts`
- `package.json`

No product documentation was modified. `package-lock.json` was not modified
because the declared packages could not be resolved or installed locally.

## TDD evidence

### RED: tests written before implementation

The contract tests were written first for:

1. valid claim, `PresenceClaimed`, and persisted `hasClaimed` state;
2. duplicate rejection;
3. expired voucher rejection;
4. claimant wallet binding;
5. ended-event rejection;
6. missing-event rejection; and
7. configured MON reward transfer.

The voucher tests were written first for:

1. exact `abi.encode` type/value order; and
2. signing the 32-byte digest via the Ethereum signed-message prefix rather
   than signing it as a raw ECDSA digest.

The requested command was attempted:

```text
$ npm run test:contract
ProcessFailed: network approval was cancelled before a decision was returned
```

The package runner is intercepted by the environment before shell execution.
Running the underlying local commands established the concrete RED state:

```text
$ hardhat test mocha
/bin/bash: line 1: hardhat: command not found
```

```text
$ ./node_modules/.bin/vitest run test/voucher.test.ts

 RUN  v3.2.7 /workspace/scratch/71c6db81714f/echopass

 FAIL  test/voucher.test.ts [ test/voucher.test.ts ]
Error: Cannot find package 'ethers' imported from '/workspace/scratch/71c6db81714f/echopass/test/voucher.test.ts'

 Test Files  1 failed (1)
      Tests  no tests
```

These failures are caused by the absent production/toolchain dependencies,
before either feature can be collected or executed.

### GREEN implementation

The minimum implementation adds:

- organizer-only event creation with a future event window;
- an immutable voucher signer;
- a one-claim mapping keyed by event and claimant;
- canonical voucher hashing;
- 65-byte signature parsing, canonical low-`s` enforcement, and `v` checks;
- exact EIP-191 recovery for a 32-byte digest;
- checks-before-effects reward payout; and
- matching frontend ABI and deployment script.

The digest definition is identical at both boundaries:

| Position | Solidity | TypeScript |
| --- | --- | --- |
| 1 | `block.chainid` | `voucher.chainId` (`uint256`) |
| 2 | `address(this)` | `voucher.contractAddress` (`address`) |
| 3 | `eventId` | `voucher.eventId` (`bytes32`) |
| 4 | `msg.sender` | `voucher.claimant` (`address`) |
| 5 | `signalHash` | `voucher.signalHash` (`bytes32`) |
| 6 | `validUntil` | `voucher.validUntil` (`uint64`) |

The TypeScript signer calls `signMessage(getBytes(digest))`. Solidity recovers
from `keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest))`.

### GREEN verification blocker

After implementation, the exact required combined command was attempted:

```text
$ npm run test:contract && npm test -- test/voucher.test.ts
ProcessFailed: network approval was cancelled before a decision was returned
```

Direct fresh verification still reports the same missing dependencies:

```text
$ hardhat test mocha
/bin/bash: line 1: hardhat: command not found
```

```text
$ ./node_modules/.bin/vitest run test/voucher.test.ts

 RUN  v3.2.7 /workspace/scratch/71c6db81714f/echopass

 FAIL  test/voucher.test.ts [ test/voucher.test.ts ]
Error: Cannot find package 'ethers' imported from '/workspace/scratch/71c6db81714f/echopass/test/voucher.test.ts'

 Test Files  1 failed (1)
      Tests  no tests
```

Build/typecheck is blocked for the same reason:

```text
$ ./node_modules/.bin/tsc -b
src/domain/voucher.ts(1,60): error TS2307: Cannot find module 'ethers' or its corresponding type declarations.
test/voucher.test.ts(8,8): error TS2307: Cannot find module 'ethers' or its corresponding type declarations.
```

Pre-existing test verification remains green:

```text
$ ./node_modules/.bin/vitest run test/code.test.ts test/tone.test.ts

 RUN  v3.2.7 /workspace/scratch/71c6db81714f/echopass

 ✓ test/code.test.ts (1 test) 4ms
 ✓ test/tone.test.ts (6 tests) 5ms

 Test Files  2 passed (2)
      Tests  7 passed (7)
```

Static repository checks:

```text
$ git diff --check
(no output; exit 0)

$ node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json valid')"
package.json valid
```

## Self-review

- Voucher replay is bounded by chain, contract, event, claimant, signal, and
  timestamp; a voucher cannot move across wallets, contracts, or chains.
- Signature recovery exactly matches Ethers `signMessage(bytes)` behavior and
  rejects malformed length, non-canonical high-`s`, and invalid `v` values.
- Event existence and time bounds are checked before signature recovery.
- Claim state is written before the external MON transfer, preventing a
  claimant contract from reentering the same event claim.
- A failed reward transfer reverts the claim and rolls back claim state.
- Event creation requires the organizer and prevents event ID replacement.
- The ABI exposes the three required methods and the required event with exact
  Solidity types.
- Tests derive the expected ABI encoding independently of the production
  helper and exercise real contract state when the toolchain is available.

## Concerns and follow-up

1. Install the declared `hardhat`, Ethers toolbox, and `ethers` dependencies,
   regenerate `package-lock.json`, then run the exact required combined command.
2. Solidity compilation and Hardhat 3 generated interaction types have not been
   verified in this environment; treat the contract as uncompiled until that
   command succeeds.
3. Superseded by fix round 1: event budgets are now isolated, the unaccounted
   `receive()` path is removed, and organizers can recover event remainders
   after the event ends.

## Fix round 1 — independent review response

Fix commit:

- `1c440ce709662cac1a4774486c5ab604ad330705` — `fix: isolate EchoPass event rewards`

### Review findings addressed in source

#### Event-scoped funding and recovery

Each `EventDetails` now records its own `remainingBudget`, initialized from the
MON attached to that event's `createEvent` transaction. A successful paid claim
checks and debits only that event's budget before transfer. The generic
`receive()` entry point was removed so new funds cannot silently enter an
unaccounted shared pool.

The funding model is now explicit:

- `reward` is the fixed reward per successful wallet claim;
- `msg.value` on `createEvent` is that event's complete initial budget;
- `msg.value >= reward` guarantees at least one paid claim when reward is nonzero;
- `remainingBudget / reward` determines how many paid claims remain; and
- another event's balance is never considered for solvency.

After `block.timestamp > endsAt`, only the immutable organizer can call
`withdrawEventFunds(eventId, recipient)` to recover that event's unclaimed or
excess budget. The contract zeros the event balance before transfer and reverts
atomically if the withdrawal recipient rejects MON. `eventBalance(eventId)`
exposes the remaining accounted budget.

Regression tests were added for:

- two successful claimants paid by one event budget;
- an exhausted event being unable to consume a separately funded event;
- the second event still paying after the first event is exhausted;
- organizer recovery of an event remainder after its deadline;
- non-organizer withdrawal rejection; and
- withdrawal rejection while an event remains active.

#### Digest and signer negative coverage

Contract-level negative tests now independently reject:

1. a signature from a non-authorized signer;
2. a signature for another chain ID;
3. a signature for another deployed EchoPass contract, with the same event
   existing on both contracts;
4. a signature for another event ID, with both events existing;
5. a signature for another claimant wallet;
6. a signature submitted with a changed signal hash; and
7. a signature submitted with a changed but still-unexpired `validUntil`.

This covers the signer and every one of the six mandated digest fields without
using expiry or missing-event guards as substitutes for signature binding.

#### Reward rollback atomicity

`contracts/test/RejectingClaimant.sol` is a test-only claimant whose `receive()`
always reverts. The test signs a valid voucher for that contract, forces the MON
payout failure, and then asserts both rollback properties:

- `hasClaimed(eventId, rejectingClaimant) == false`; and
- `eventBalance(eventId)` is unchanged.

#### ABI parity

The browser ABI now includes the complete EchoPass ABI, including public
immutable getters, event-budget queries, withdrawal, and both events. A Hardhat
test reads the compiled `EchoPass` artifact, normalizes every ABI item, and
compares it with `echoPassAbi`. This makes future Solidity/browser ABI drift an
executable failure once the toolchain is installed.

#### Monad compiler and testnet configuration

`hardhat.config.ts` now sets:

```text
Solidity: 0.8.28
EVM version: prague
Optimizer: enabled, 200 runs
Monad Testnet RPC: https://testnet-rpc.monad.xyz
Monad Testnet chain ID: 10143
Private-key variable: MONAD_PRIVATE_KEY
RPC override variable: MONAD_TESTNET_RPC_URL
```

These values follow the current official [Monad Hardhat deployment guide](https://docs.monad.xyz/guides/deploy-smart-contract/hardhat)
and [Monad Hardhat verification guide](https://docs.monad.xyz/guides/verify-smart-contract/hardhat).
No official template was cloned or copied.

`package.json` now classifies `ethers` as a runtime dependency because browser
voucher code imports it directly, while Hardhat and its toolbox remain dev
dependencies. It also provides `npm run deploy:monad` for the configured testnet.

### Fix-round RED evidence

All new regression tests and the rejecting-recipient test fixture were added
before the event-accounting, withdrawal, ABI, and configuration source changes.
The dependency-level RED result remains:

```text
$ hardhat test mocha
/bin/bash: line 1: hardhat: command not found
```

The environment therefore cannot reach the individual failing assertions. This
is not represented as a valid observed RED for each regression.

### Fix-round verification evidence

The exact acceptance command was retried after the fixes:

```text
$ npm run test:contract && npm test -- test/voucher.test.ts
ProcessFailed: network approval was cancelled before a decision was returned
```

Direct contract execution remains blocked:

```text
$ hardhat test mocha
/bin/bash: line 1: hardhat: command not found
```

Typecheck remains blocked only on the unavailable Ethers package:

```text
$ ./node_modules/.bin/tsc -b
src/domain/voucher.ts(1,60): error TS2307: Cannot find module 'ethers' or its corresponding type declarations.
test/voucher.test.ts(8,8): error TS2307: Cannot find module 'ethers' or its corresponding type declarations.
```

The unaffected test baseline remains green after the fixes:

```text
$ ./node_modules/.bin/vitest run test/code.test.ts test/tone.test.ts

 RUN  v3.2.7 /workspace/scratch/71c6db81714f/echopass

 ✓ test/code.test.ts (1 test) 4ms
 ✓ test/tone.test.ts (6 tests) 5ms

 Test Files  2 passed (2)
      Tests  7 passed (7)
```

Repository/static metadata checks:

```text
$ git diff --check
(no output; exit 0)

$ node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); if(p.dependencies.ethers!=='^6.17.0'||p.devDependencies.hardhat!=='^3.12.0') process.exit(1); console.log('package metadata parses and direct dependency roles are valid')"
package metadata parses and direct dependency roles are valid
```

### Exact networked GitHub fallback

The lockfile cannot be honestly repaired without resolving the dependency tree.
On a network-enabled GitHub Codespace (or an equivalent trusted development
runner), run exactly:

```bash
cd echopass
npm install
npm ci
npm run test:contract && npm test -- test/voucher.test.ts
npm run build
git status --short package-lock.json
git add package-lock.json
git commit -m "chore: lock EchoPass contract toolchain"
```

For GitHub Actions after that lockfile commit, the minimal verification job is:

```yaml
name: EchoPass contract
on: [push, pull_request]
jobs:
  test-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run test:contract
      - run: npm test -- test/voucher.test.ts
      - run: npm run build
```

Until the generated lockfile is committed, `npm ci` from a clean checkout is
expected to fail. The GitHub fallback is therefore a remediation procedure, not
evidence that CI currently passes.

### Exact Remix compile/deploy fallback

If a networked Node environment is unavailable, use Remix only to establish
Solidity compilation and manual deployment viability:

1. Open Remix and create `EchoPass.sol` from the repository source.
2. Select compiler `0.8.28`, EVM version `prague`, optimizer enabled with 200 runs.
3. Compile `EchoPass.sol` and retain the generated ABI for comparison.
4. Connect the injected wallet provider to Monad Testnet, chain ID `10143`, RPC
   `https://testnet-rpc.monad.xyz`.
5. Deploy with the authorized voucher signer address as the constructor value.
6. For an event, call `createEvent(bytes32,uint64,uint96)` with the desired total
   event budget in Remix's transaction value field.

Remix cannot execute the TypeScript digest/signature suite, Hardhat replay tests,
or automated compiled/frontend ABI parity assertion. It is a compile/deploy
fallback only and does not satisfy Task 3 Step 4 by itself.

### Remaining blockers

1. `package-lock.json` is still out of sync because npm registry resolution is
   prohibited in this workspace. A clean `npm ci` remains non-reproducible until
   the exact networked fallback above generates and commits the lockfile.
2. The Solidity source, Hardhat configuration, 20 contract tests, voucher tests,
   and ABI parity test remain unexecuted here. No acceptance-pass claim is made.
3. Event budgets are fixed at creation in this MVP. There is no post-creation
   top-up function; the organizer must fund the intended claim capacity when
   calling `createEvent`.
