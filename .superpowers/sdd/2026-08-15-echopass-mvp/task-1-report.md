# Task 1 report: repository baseline and rotating-code domain

## RED

Command:

```text
CI=1 npm test -- test/code.test.ts
```

Result: expected failure because `src/domain/code.ts` did not exist.

```text
> echopass@0.0.0 test
> vitest run test/code.test.ts

 RUN  v3.2.7 /workspace/scratch/71c6db81714f/echopass

 FAIL  test/code.test.ts [ test/code.test.ts ]
Error: Cannot find module '../src/domain/code' imported from '/workspace/scratch/71c6db81714f/echopass/test/code.test.ts'
```

## GREEN

Command:

```text
CI=1 npm test -- test/code.test.ts && CI=1 npm run build
```

Result: focused test passed and the production build exited 0.

```text
✓ test/code.test.ts (1 test)
Test Files  1 passed (1)
Tests  1 passed (1)

> echopass@0.0.0 build
> tsc -b && vite build

vite v7.3.6 building client environment for production...
✓ 1 modules transformed.
✓ built in 41ms
```

Full test suite: `CI=1 npm test` — 1 test passed.

## Files changed

- `package.json` and `package-lock.json`: Vite, TypeScript, and Vitest baseline scripts/dependencies.
- `tsconfig.json`, `vite.config.ts`, and `index.html`: TypeScript/Vite baseline configuration.
- `test/code.test.ts`: rotating-code behavior test.
- `src/domain/code.ts`: 30-second slot calculation, SHA-256-derived six-digit code generation, and current/previous slot acceptance.
- `.superpowers/sdd/2026-08-15-echopass-mvp/task-1-report.md`: this report.

## Self-review

- `timeSlot` uses the required 30,000 ms default and floor-based slot calculation.
- `deriveCode` is deterministic for the same event, secret, and slot, uses SHA-256, and always returns six digits with leading-zero padding.
- `acceptedCodes` returns codes in current-slot then previous-slot order.
- Only Task 1 files and the required report were added; generated build metadata was removed before commit.
- No concerns identified.

## Commit

Task 1 implementation commit: `379d682e590e0be97a5a7b34e6e3a9ac0e431054`
