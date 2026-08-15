# Task 2 — Audible code transport

## RED evidence

Added `test/tone.test.ts` before the production module. The requested `npm test -- test/tone.test.ts` command was blocked by the execution environment's network-approval gate before Vitest started. Running the local Vitest binary directly confirmed the intended failure:

```text
Error: Cannot find module '../src/audio/tone'
```

## GREEN evidence

Focused test run after implementation:

```text
./node_modules/.bin/vitest run test/tone.test.ts
Test Files  1 passed (1)
Tests  6 passed (6)
```

Full verification:

```text
./node_modules/.bin/vitest run
Test Files  2 passed (2)
Tests  7 passed (7)

./node_modules/.bin/tsc -b
passed

./node_modules/.bin/vite build
✓ built in 35ms
```

## Files

- `src/audio/tone.ts` — standard decimal DTMF mapping, inclusive ±25 Hz peak matching, six-digit validation, and sequential Web Audio oscillator scheduling.
- `test/tone.test.ts` — mapping, tolerance, invalid input, scheduling, and six-digit validation behavior tests.

## Commit

`689eb1bc8663bdbed860c694695d7e7ddc0d098e` (`feat: add audible DTMF code transport`)

## Self-review

- All ten decimal digits use the standard DTMF low/high frequency pairs.
- `detectDigit` accepts each peak independently within the specified tolerance and returns `null` when no pair matches.
- `playCode` schedules each digit's two oscillators together, then advances to the next digit after a fixed tone and gap interval; an injected `AudioContext` keeps the behavior testable.
- Only Task 2 source and test files were included in the implementation commit; unrelated worktree files were left untouched.
