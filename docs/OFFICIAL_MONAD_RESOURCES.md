# EchoPass — Official Monad Resource Decisions

Monad Blitz resource entry point: https://monad-foundation.notion.site/01c6367594f2821ba050010d2dfcbc7f

The Notion page is navigation only. Concrete network and deployment values below
are sourced from the current official Monad documentation.

## Use now

### Monad Testnet

- Chain ID: `10143`
- Public RPC: `https://testnet-rpc.monad.xyz`
- Primary explorer: `https://testnet.monadvision.com`
- Secondary explorer: `https://testnet.monadscan.com`
- Faucet: `https://faucet.monad.xyz`
- Official network reference: https://docs.monad.xyz/developer-essentials/testnet

The official public RPC currently reports `eth_chainId = 0x279f` (`10143`). The
testnet was reset from genesis on 2025-12-16, so deployment addresses from before
that reset must not be reused.

### Browser deployment fallback

Official Remix guide: https://docs.monad.xyz/guides/deploy-smart-contract/remix

Use Remix if the local sandbox cannot install Hardhat dependencies:

1. Add Monad Testnet to the wallet.
2. Open Remix and create `EchoPass.sol` from the repository source.
3. Compile with Solidity `0.8.28`; select `prague` EVM target when available.
4. Select **Injected Provider** and verify chain ID `10143`.
5. Deploy with the disposable testnet voucher signer address as constructor input.
6. Record contract address and deployment transaction.
7. Create the demo event and test a real claim before the presentation.

Official deployment index: https://docs.monad.xyz/guides/deploy-smart-contract

### Hardhat configuration and verification

Official Hardhat deploy guide: https://docs.monad.xyz/guides/deploy-smart-contract/hardhat

- Solidity: `0.8.28`
- EVM version: `prague`
- Monad Testnet chain ID: `10143`
- Monad Testnet RPC: `https://testnet-rpc.monad.xyz`

Official verification guide: https://docs.monad.xyz/guides/verify-smart-contract/hardhat

After deployment, use the repository's existing Hardhat 3 toolchain to verify on
Sourcify/MonadVision and Monadscan. Confirm the result using both explorer links,
because the official guide notes that the verification command can report an
error even when explorer verification succeeded. Do not clone or copy the
official Hardhat template.

## Reference only

- Hardhat and Foundry starters: configuration reference only. Do not clone or fork during this project; the repository already started from an original empty history.
- Wallet templates: do not adopt now because changing the frontend stack would threaten completion.

## Do not add to this MVP

- EIP-7702/account abstraction
- Sponsored transactions
- x402
- Indexers
- Blinks
- Oracles

These are legitimate Monad tools, but none is required for the core sound-challenge mechanism or five-minute demo. Adding them now would reduce completion without increasing the judge-visible innovation.
