const { ethers } = require('hardhat');

const networkConfig = {
    5: {
        name: 'goerli',
        ethUsdPriceFeed: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e', // eth/usd
        vrfCoordinatorV2Address: '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D',
        entranceFee: ethers.utils.parseEther('0.01'),
        gasLane: '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15',
        subscriptionId: '0',
        callbackGasLimit: '500000',
        interval: 30,
    },
    137: {
        name: 'polygon',
        ethUsdPriceFeed: '0xF9680D99D6C9589e2a93a78A04A279e509205945', // eth/usd
        vrfCoordinatorV2Address: '0xAE975071Be8F8eE67addBC1A82488F1C24858067',
        entranceFee: ethers.utils.parseEther('0.02'),
        gasLane: '0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93',
        subscriptionId: '0',
        callbackGasLimit: '500000',
        interval: 30,
    },
    31337: {
        name: 'hardhat',
        entranceFee: ethers.utils.parseEther('1'),
        gasLane: '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15',
        interval: 30,
        callbackGasLimit: '500000', // 500,000 gas
    },
};

const developmentChains = ['hardhat', 'localhost'];
const CHAIN_LINK_MOCK_BASE_FEE = ethers.utils.parseEther('0.25'); // 25 LINK per request

module.exports = {
    networkConfig,
    developmentChains,
    CHAIN_LINK_MOCK_BASE_FEE,
};
