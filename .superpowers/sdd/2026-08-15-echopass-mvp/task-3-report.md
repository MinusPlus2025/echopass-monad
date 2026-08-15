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
3. The minimal reward pool can be funded during `createEvent` or through
   `receive()`, but there is intentionally no organizer withdrawal path in the
   requested MVP interface. Unclaimed MON therefore remains in the contract.
