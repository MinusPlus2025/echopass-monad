import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers'
import { defineConfig } from 'hardhat/config'

const monadPrivateKey = process.env.MONAD_PRIVATE_KEY

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  paths: {
    sources: './contracts',
    tests: './contracts/test',
    cache: './cache',
    artifacts: './artifacts',
  },
  solidity: {
    version: '0.8.28',
    settings: {
      evmVersion: 'prague',
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainId: 31_337,
    },
    monadTestnet: {
      type: 'http',
      url:
        process.env.MONAD_TESTNET_RPC_URL ??
        'https://testnet-rpc.monad.xyz',
      accounts: monadPrivateKey ? [monadPrivateKey] : [],
      chainId: 10_143,
    },
  },
})
