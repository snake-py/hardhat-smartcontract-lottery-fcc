require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-deploy');
require('solidity-coverage');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('dotenv').config();

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || process.env.ALCHEMY_MAINNET_RPC_URL;
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL || '';
const PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY || '0x';
// optional
const MNEMONIC = process.env.MNEMONIC || 'your mnemonic';

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6,
        },
    },
    gasReporter: {
        currency: 'USD',
        enabled: process.env.REPORT_GAS,
        noColors: true,
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        outputFile: 'gas-report.txt',
    },
    solidity: '0.8.17',
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
        },
        player: {
            default: 1, // here this will by default take the second account as player
        },
    },
    mocha: {
        timeout: 200000,
    },
};
