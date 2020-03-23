# enable-router-contracts

Repayment router contracts to distribute funds to members of provided token registry

[![CircleCI](https://circleci.com/gh/enabledao/enable-router-contracts.svg?style=svg)](https://circleci.com/gh/enabledao/enable-router-contracts)

# Deployed Contracts

### Ropsten

| Contract | Deployment cost | Address                                                                                                                       | Logic                                                                                                                         |
| -------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Router   | 591,571         | [0x1a3058D8E07b1127b855854550658aE803A4Bdec](https://ropsten.etherscan.io/address/0x1a3058D8E07b1127b855854550658aE803A4Bdec) | [0x2Bcb56a96191f73eAebbA09398Bc3a5c73d24a3e](https://ropsten.etherscan.io/address/0x2Bcb56a96191f73eAebbA09398Bc3a5c73d24a3e) |

### Kovan

| Contract | Deployment cost | Address                                                                                                                     | Logic                                                                                                                       |
| -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Router   | 591,571         | [0xE09F9BC68DeA6435C86287515C36A8477570684B](https://kovan.etherscan.io/address/0xE09F9BC68DeA6435C86287515C36A8477570684B) | [0xA832825439ef14eF26B8939532c93794e385D209](https://kovan.etherscan.io/address/0xA832825439ef14eF26B8939532c93794e385D209) |

# Developer Instructions

## CI Pipeline

[https://app.circleci.com/jobs/github/enabledao/enable-router-contracts](https://app.circleci.com/jobs/github/enabledao/enable-router-contracts)

## `zos` workflow for local development

We use [ZeppelinOS](https://docs.zeppelinos.org/docs/start.html) to develop, deploy and operate the Enable loan kit packages. The [ZeppelinOS Documentation](https://docs.zeppelinos.org/docs/start.html) is a good start.

### Setup

1. Run `npm install` to install all zeppelinOS related dependencies
2. Run `ganache-cli` (or `ganache-cli --deterministic`) to run a local blockchain
3. Create your own `.env` file based on `.env.sample`. These are the `process.env` variables that will be used for deployment / application. As of Feb 2020 this is the Infura API key and mnemonic"

### Deploy to ganache `development` network

For background: read [Publishing an EVM package](https://docs.zeppelinos.org/docs/publishing.html).

`npm run deploy -- --network development`

- This publishes the project's app, package and provider, then updates the [zos config](https://docs.zeppelinos.org/docs/configuration.html) file with "app.address" field that is needed for tests to run.
- Deploys the contracts in the project
- Creates Proxies for the contract in the network. See [Quickstart](https://docs.zeppelinos.org/docs/first.html) for context.

`npm run initialize -- --network development`

- Initializes all deployed proxies on the network

### Deploy to ethereum and development networks _mainnet, ropsten, kovan, ganche_

1. Run `npm run deploy -- --network kovan`; change the network to the desired network
2. Run `npm run initialize -- --network kovan`; change the network to the desired network

### Running tests

1. `npm run test`.
