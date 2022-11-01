const { network } = require('hardhat');
const { developmentChains, CHAIN_LINK_MOCK_BASE_FEE } = require('../helper-hardhat-config');

const GAS_PRICE_LINK = 1e9;
// link per gas in real network, but here we hardcoded it
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainName = network.name;
    if (!developmentChains.includes(chainName)) {
        return;
    }
    log('local network detected, deploying mocks...');

    await deploy('VRFCoordinatorV2Mock', {
        from: deployer,
        args: [CHAIN_LINK_MOCK_BASE_FEE, GAS_PRICE_LINK],
        log: true,
        waitConfirmation: network.config.blockConfirmations || 1,
    });
    log('VRFCoordinatorV2Mock deployed');
    log('------------------------------------');
};

module.exports.tags = ['mocks', 'all'];
