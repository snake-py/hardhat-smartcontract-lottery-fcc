const { assert, expect } = require('chai');
const { network, getNamedAccounts, deployments, ethers } = require('hardhat');
const { developmentChains, networkConfig } = require('../../helper-hardhat-config');

// run only on a live net
!developmentChains.includes(network.name) &&
    describe('Raffle Unit Test', function () {
        let raffle, raffleEntranceFee, deployer;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            raffle = await ethers.getContract('Raffle', deployer);
            raffleEntranceFee = await raffle.getEntranceFee();
        });

        describe('Full Fill Random Words', function () {
            it('works with live ChainLInk Keepers and ChainLInk VRF, we get a random Winner', async function () {
                // enter the raffle
                const startingTimeStamp = await raffle.getLatestTimeStamp();
                const accounts = await ethers.getSigners();
                await new Promise(async (resolve, reject) => {
                    raffle.once('WinnerPicked', async () => {
                        console.log('WinnerPicked event fired');
                        try {
                            const winner = await raffle.getRecentWinner();
                            const raffleState = await raffle.getRaffleState();
                            const winnerBalance = await account[0].getBalance();
                            const endingTimeStamp = await raffle.getLatestTimeStamp();
                            await expect(raffle.getPlayer(0)).to.be.reverted();
                            assert.equal(winner.toString(), accounts[0].address);
                            assert.equal(raffleState.toString(), '0');
                            assert.equal(
                                winnerBalance.toString(),
                                winnerStartingBalance.add(raffleEntranceFee).toString()
                            );
                            assert(endingTimeStamp > startingTimeStamp);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    });
                    // Entering the Raffle
                    await raffle.enter({ value: raffleEntranceFee });
                    const winnerStartingBalance = await accounts[0].getBalance();
                });
            });
        });
    });
