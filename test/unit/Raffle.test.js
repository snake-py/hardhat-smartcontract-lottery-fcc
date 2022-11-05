const { assert, expect } = require('chai');
const { network, getNamedAccounts, deployments, ethers } = require('hardhat');
const { developmentChains, networkConfig } = require('../../helper-hardhat-config');

developmentChains.includes(network.name) &&
    describe('Raffle Unit Test', function () {
        let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval;
        const chainId = network.config.chainId;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(['all']);
            raffle = await ethers.getContract('Raffle', deployer);
            vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock', deployer);
            raffleEntranceFee = await raffle.getEntranceFee();
            interval = await raffle.getInterval();
        });
        describe('Raffle Constructor', function () {
            it('initializes the raffle contract correctly', async () => {
                // Ideally we make our test have just 1 assert per it block

                // 0 = open raffle
                // 1 = closed raffle
                const raffleState = await raffle.getRaffleState();
                const interval = await raffle.getInterval();
                assert.equal(raffleState.toString(), '0');
                assert.equal(interval.toString(), networkConfig[chainId]['interval']);
            });
        });

        describe('Raffle Functions', function () {
            it("reverts if you don't pay enough", async () => {
                await expect(raffle.enterRaffle()).to.be.revertedWith(
                    'Raffle__NotEnoughETHEntered'
                );
            });

            it('records players if they enter', async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });
                const playerFromContract = await raffle.getPlayers();
                assert.equal(playerFromContract, deployer);
            });

            it('emits event on enter', async () => {
                await expect(raffle.enterRaffle({ value: raffleEntranceFee }))
                    .to.emit(raffle, 'RaffleEntered')
                    .withArgs(deployer);
            });

            it("doesn't allow entrance when raffle is calculating winner", async () => {
                await enterRaffleAndIncreaseTime(raffle, raffleEntranceFee, interval);
                // we pretend to be a chain link keeper
                await raffle.performUpkeep([]);
                await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                    'Raffle__NotOpen'
                );
            });

            describe('CheckUpKeep', function () {
                it('returns false if people have not send any eth', async () => {
                    await network.provider.send('evm_increaseTime', [interval.toNumber() + 1]); // manipulate time of the test block chain
                    await network.provider.send('evm_mine', []); // mine the block
                    // simulate the checkUpkeep function
                    // instead of calling - await raffle.checkUpkeep([]); // this will return the transaction but we only need the value
                    // callStatic also just simulates a transaction and then discards all changes of the state
                    const { upKeepNeeded } = await raffle.callStatic.checkUpkeep('0x');
                    // hmm in fact this is undefined ???
                    assert(!upKeepNeeded);
                });

                it('returns false raffle is not open', async () => {
                    await enterRaffleAndIncreaseTime(raffle, raffleEntranceFee, interval);
                    await raffle.performUpkeep([]);
                    const raffleState = await raffle.getRaffleState();
                    const { upKeepNeeded } = await raffle.callStatic.checkUpkeep('0x');
                    assert(!upKeepNeeded);
                    assert.equal(raffleState.toString(), '1');
                });

                it("returns false if enough time hasn't passed", async () => {
                    await enterRaffleAndIncreaseTime(raffle, raffleEntranceFee, interval, -5);
                    const { upkeepNeeded } = await raffle.callStatic.checkUpkeep('0x'); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                    assert(!upkeepNeeded);
                });
                it('returns true if enough time has passed, has players, eth, and is open', async () => {
                    await enterRaffleAndIncreaseTime(raffle, raffleEntranceFee, interval);
                    const { upkeepNeeded } = await raffle.callStatic.checkUpkeep('0x'); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                    assert(upkeepNeeded);
                });
            });
            describe('PerformUpkeep', function () {
                it('can only run if checkUpkeep returns true', async () => {
                    await enterRaffleAndIncreaseTime(raffle, raffleEntranceFee, interval);
                    const tx = await raffle.performUpkeep('0x');
                    assert(tx);
                });
                it('reverts if checkUpkeep returns false', async () => {
                    await expect(raffle.performUpkeep('0x')).to.be.revertedWith(
                        'Raffle__UpKeepNotNeeded'
                    );
                });
                it('updates the raffle state, emits an event and calls the vrfcoordintor', async () => {
                    await enterRaffleAndIncreaseTime(raffle, raffleEntranceFee, interval);
                    const txResponse = await raffle.performUpkeep('0x');
                    const txReceipt = await txResponse.wait(1);
                    const requestId = txReceipt.events[1].args.requestId;
                    const raffleState = await raffle.getRaffleState();
                    assert(requestId.toNumber() > 0);
                    assert.equal(raffleState.toString(), '1');
                });
            });
            describe('Full Fill Random Words', function () {
                beforeEach(async () => {
                    await enterRaffleAndIncreaseTime(raffle, raffleEntranceFee, interval);
                });
                it('can only be called after performUpkeep has been called', async () => {
                    await expect(
                        vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                    ).to.be.revertedWith(
                        'nonexistent request' // taken from the vrf coordinator mock contract
                    );
                    await expect(
                        vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                    ).to.be.revertedWith(
                        'nonexistent request' // taken from the vrf coordinator mock contract
                    );
                });
                it("picks a winner, resets the lottery and sends money to the winner's address", async () => {
                    const accounts = await ethers.getSigners();
                    const additionalEntrances = 3;
                    await enterAdditionalPeopleIntoRaffle(
                        additionalEntrances,
                        accounts,
                        raffle,
                        raffleEntranceFee
                    );
                    const startingTimeStamp = await raffle.getLatestTimeStamp();

                    // perform upkeep (mock being the chainlink keeper) will kick off
                    // fulfillRandomWords (mock being the vrf coordinator)
                    // we will have to wait for the fulfillRandomWords to be called
                    await new Promise(async (resolve, reject) => {
                        raffle.once('WinnerPicked', async () => {
                            // event listener for WinnerPicked
                            console.log('WinnerPicked event fired!');
                            // assert throws an error if it fails, so we need to wrap
                            // it in a try/catch so that the promise returns event
                            // if it fails.
                            try {
                                // Now lets get the ending values...
                                const recentWinner = await raffle.getRecentWinner();
                                const raffleState = await raffle.getRaffleState();
                                const winnerBalance = await accounts[1].getBalance();
                                const endingTimeStamp = await raffle.getLatestTimeStamp();
                                await expect(raffle.getPlayer(0)).to.be.reverted;
                                // Comparisons to check if our ending values are correct:
                                assert.equal(recentWinner.toString(), accounts[1].address);
                                assert.equal(raffleState, 0);
                                assert.equal(
                                    winnerBalance.toString(),
                                    startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                        .add(
                                            raffleEntranceFee
                                                .mul(additionalEntrances)
                                                .add(raffleEntranceFee)
                                        )
                                        .toString()
                                );
                                assert(endingTimeStamp > startingTimeStamp);
                                resolve(); // if try passes, resolves the promise
                            } catch (e) {
                                reject(e); // if try fails, rejects the promise
                            }
                        });
                        const tx = await raffle.performUpkeep('0x');
                        const txReceipt = await tx.wait(1);
                        const startingBalance = await accounts[1].getBalance();
                        await vrfCoordinatorV2Mock.fulfillRandomWords(
                            txReceipt.events[1].args.requestId,
                            raffle.address
                        );
                    });
                });
            });
        });
    });

const enterRaffleAndIncreaseTime = async (raffle, raffleEntranceFee, interval, increaseBy = 1) => {
    await raffle.enterRaffle({ value: raffleEntranceFee });
    await network.provider.send('evm_increaseTime', [interval.toNumber() + increaseBy]);
    await network.provider.request({ method: 'evm_mine', params: [] });
};

const enterAdditionalPeopleIntoRaffle = async (
    additionalEntrants,
    accounts,
    contract,
    entranceFee,
    startingAccountIndex = 1
) => {
    for (let i = 1; i < additionalEntrants + startingAccountIndex; i++) {
        const account = contract.connect(accounts[i]);
        await account.enterRaffle({ value: entranceFee });
    }
};
