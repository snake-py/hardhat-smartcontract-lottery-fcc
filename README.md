# SmartContract Lottery

```bash
npm i -D @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers @nomiclabs/hardhat-etherscan @nomiclabs/hardhat-waffle chai ethereum-waffle hardhat hardhat-contract-sizer hardhat-deploy hardhat-gas-reporter prettier prettier-plugin-solidity solhint solidity-coverage dotenv
```

## Deploy

To really deploy this contract following steps are required:

1. install npm
2. install dependencies
3. create .env according to example
4. get ChainLink SubId for Chainlink VRF of the target network
5. Deploy Contract using the SubId (inside the helper-hard-config.js)
6. Register the contract with Chainlink VRF & its SubId
7. Register the contract with chainlink keepers
8. Run staging tests
