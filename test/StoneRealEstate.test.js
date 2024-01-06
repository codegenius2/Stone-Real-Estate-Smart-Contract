const { expect } = require("chai");
const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const { expectRevertCustomError } = require("custom-error-test-helper");
const { ZERO_ADDRESS } = constants;
const StoneRealEstate = artifacts.require("../contracts/StoneRealEstate.sol");
const FiatTokenV2_1 = artifacts.require("../contracts/FiatTokenV2_1.sol");
const FiatTokenProxy = artifacts.require("../contracts/FiatTokenProxy.sol");
const { isAddress } = require("web3-utils");

contract("StoneRealEstate", (accounts) => {
  const owner = accounts[0];
  const usdcDeployer = accounts[1];
  const user1 = accounts[2];
  const admin = accounts[3];
  const user2 = accounts[4];
  const multipleWalletArray = [user1, user2];
  const newOwnerReceiptWallet = accounts[5];
  const newUsdcAddress = accounts[6];
  const user3 = accounts[7];
  const bigMultipleArray = [user1, user2, user3];
  const tokenId0 = 0;
  const tokenId1 = 1;
  const oneUSDC = 1000000;
  const tenUSDC = 10000000;
  const twentyUSDC = 20000000;
  const hundredUSDC = 100000000;
  const thousandUSDC = 1000000000;
  const nineThousandUSDC = 9000000000;
  const mintFees = 100;
  let StoneRealEstateInstance;
  let FiatTokenV2_1Instance;
  let FiatTokenProxyInstance;
  let FiatTokenV2_1ViaProxy;

  context("when contract just deployed without any mint", () => {
    beforeEach(async () => {
      // simulate usdc contract
      FiatTokenV2_1Instance = await FiatTokenV2_1.new({ from: usdcDeployer });
      FiatTokenProxyInstance = await FiatTokenProxy.new(
        FiatTokenV2_1Instance.address,
        { from: usdcDeployer }
      );
      FiatTokenV2_1ViaProxy = await FiatTokenV2_1.at(
        FiatTokenProxyInstance.address
      );
      await FiatTokenV2_1ViaProxy.initialize(
        "FiatTokenV1",
        "USD//C (USDC)",
        "usdc",
        6,
        owner,
        owner,
        owner,
        owner,
        { from: owner }
      );
      await FiatTokenV2_1ViaProxy.configureMinter(owner, thousandUSDC, {
        from: owner,
      });
      // mint 1000 usdc
      await FiatTokenV2_1ViaProxy.mint(owner, thousandUSDC, { from: owner });
      // set mint price to 10 usdc, set transfer fee to 1 usdc, max supply to 100
      StoneRealEstateInstance = await StoneRealEstate.new(
        FiatTokenV2_1ViaProxy.address,
        owner,
        tenUSDC,
        oneUSDC,
        mintFees,
        100,
        "https://uri.com/",
        "collectionName",
        "collectionSymbol",
        { from: owner }
      );
      // approve StoneRealEstateInstance
      await FiatTokenV2_1ViaProxy.approve(
        StoneRealEstateInstance.address,
        thousandUSDC,
        { from: owner }
      );
    });

    context("variable set by constructor", () => {
      describe("price", () => {
        context("when called", () => {
          it("...should return an uint as a Big Number", async () => {
            const price = await StoneRealEstateInstance.price();
            expect(BN.isBN(price)).to.be.true;
          });
          it("...should be equal to the one passed in constructor", async () => {
            expect(
              new BN(await StoneRealEstateInstance.price())
            ).to.be.a.bignumber.that.equals(new BN(10000000));
          });
          it("...should not be equal to another number than the one passed in constructor", async () => {
            expect(
              new BN(await StoneRealEstateInstance.price())
            ).to.be.a.bignumber.that.not.equals(new BN(10000001));
          });
        });
      });
      describe("transferFees", () => {
        context("when called", () => {
          it("...should return an uint as a Big Number", async () => {
            const transferFees = await StoneRealEstateInstance.transferFees();
            expect(BN.isBN(transferFees)).to.be.true;
          });
          it("...should be equal to the one passed in constructor", async () => {
            expect(
              new BN(await StoneRealEstateInstance.transferFees())
            ).to.be.a.bignumber.that.equals(new BN(1000000));
          });
          it("...should not be equal to another number than the one passed in constructor", async () => {
            expect(
              new BN(await StoneRealEstateInstance.transferFees())
            ).to.be.a.bignumber.that.not.equals(new BN(1000001));
          });
        });
      });
      describe("maxSupply", () => {
        context("when called", () => {
          it("...should return an uint as a Big Number", async () => {
            const maxSupply = await StoneRealEstateInstance.maxSupply();
            expect(BN.isBN(maxSupply)).to.be.true;
          });
          it("...should be equal to the one passed in constructor", async () => {
            expect(
              new BN(await StoneRealEstateInstance.maxSupply())
            ).to.be.a.bignumber.that.equals(new BN(100));
          });
          it("...should not be equal to another number than the one passed in constructor", async () => {
            expect(
              new BN(await StoneRealEstateInstance.maxSupply())
            ).to.be.a.bignumber.that.not.equals(new BN(101));
          });
        });
      });
      describe("ownerFundReceiptWallet", () => {
        context("when called", () => {
          it("...should return an address as a string", async () => {
            expect(
              isAddress(await StoneRealEstateInstance.ownerFundReceiptWallet())
            ).to.be.true;
          });
          it("...should be equal to the one passed in constructor", async () => {
            expect(
              await StoneRealEstateInstance.ownerFundReceiptWallet()
            ).equal(owner);
          });
          it("...should not be equal to zero address", async () => {
            expect(
              await StoneRealEstateInstance.ownerFundReceiptWallet()
            ).not.equal(ZERO_ADDRESS);
          });
          it("...should not be equal to another address than the one passed in constructor", async () => {
            expect(await StoneRealEstateInstance.maxSupply()).not.equal(user1);
          });
        });
      });
      describe("usdcAddress", () => {
        context("when called", () => {
          it("...should return an address as a string", async () => {
            expect(isAddress(await StoneRealEstateInstance.usdcAddress())).to.be
              .true;
          });
          it("...should be equal to the one passed in constructor", async () => {
            expect(await StoneRealEstateInstance.usdcAddress()).equal(
              FiatTokenV2_1ViaProxy.address
            );
          });
          it("...should not be equal to zero address", async () => {
            expect(await StoneRealEstateInstance.usdcAddress()).not.equal(
              ZERO_ADDRESS
            );
          });
          it("...should not be equal to another address than the one passed in constructor", async () => {
            expect(await StoneRealEstateInstance.usdcAddress()).not.equal(
              user1
            );
          });
        });
      });
      describe("isWhitelist", () => {
        context("when called", () => {
          it("...should be a boolean", async () => {
            expect(await StoneRealEstateInstance.isWhitelist(owner)).to.be.a(
              "boolean"
            );
          });
          it("...should be equal to false", async () => {
            expect(await StoneRealEstateInstance.isWhitelist(owner)).equal(
              false
            );
          });
          it("...should not be equal to true", async () => {
            expect(await StoneRealEstateInstance.isWhitelist(owner)).not.equal(
              true
            );
          });
        });
      });
      describe("isAdmin", () => {
        context("when called", () => {
          it("...should be a boolean", async () => {
            expect(await StoneRealEstateInstance.isAdmin(owner)).to.be.a(
              "boolean"
            );
          });
          it("...should be equal to false", async () => {
            expect(await StoneRealEstateInstance.isAdmin(owner)).equal(false);
          });
          it("...should not be equal to true", async () => {
            expect(await StoneRealEstateInstance.isAdmin(owner)).not.equal(
              true
            );
          });
        });
      });
    });
    context("getter", () => {
      context("custom contract getter", () => {
        describe("getAllWhitelistedAddress", () => {
          context("when called from owner", () => {
            it("...should return an empty array", async () => {
              const storedData =
                await StoneRealEstateInstance.getAllWhitelistedAddress({
                  from: owner,
                });
              expect(storedData).to.deep.equal([]);
            });
          });
          context("when called from admin", () => {
            it("...should return an empty array", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              expect(
                await StoneRealEstateInstance.getAllWhitelistedAddress({
                  from: admin,
                })
              ).to.deep.equal([]);
            });
          });
          context("when called from others", () => {
            it("...should revert and throw NotAdminOrOwner error", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.getAllWhitelistedAddress({
                  from: user1,
                }),
                "NotAdminOrOwner"
              );
            });
          });
        });
      });
      context("import contract getter", () => {
        describe("totalSupply", () => {
          context("when called", () => {
            it("...should return an uint as a Big Number", async () => {
              const totalSupply = await StoneRealEstateInstance.totalSupply();
              expect(BN.isBN(totalSupply)).to.be.true;
            });
            it("...should be equal to 0", async () => {
              expect(
                new BN(await StoneRealEstateInstance.totalSupply())
              ).to.be.a.bignumber.that.equals(new BN(0));
            });
            it("...should not be equal to 1", async () => {
              expect(
                new BN(await StoneRealEstateInstance.totalSupply())
              ).to.be.a.bignumber.that.not.equals(new BN(1));
            });
          });
        });
      });
    });
    context("setter", () => {
      context("custom contract setter", () => {
        describe("addToWhitelist", () => {
          context("when called from owner", () => {
            it("...should revert if user is already whitelist", async () => {
              await StoneRealEstateInstance.addToWhitelist(user1, {
                from: owner,
              });
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.addToWhitelist(user1, { from: owner }),
                "AlreadyWhitelisted"
              );
            });
            it("...should change the whitelist status of the wallet to true ", async () => {
              await StoneRealEstateInstance.addToWhitelist(user1, {
                from: owner,
              });
              expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                .true;
            });
            it("...should emit an AddedToWhitelist event", async () => {
              const receipt = await StoneRealEstateInstance.addToWhitelist(
                user1,
                {
                  from: owner,
                }
              );
              expectEvent(receipt, "AddedToWhitelist", {
                newWhitelistedWallet: user1,
              });
            });
          });
          context("when called from admin", () => {
            it("...should revert if user is already whitelist", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await StoneRealEstateInstance.addToWhitelist(user1, {
                from: admin,
              });
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.addToWhitelist(user1, { from: admin }),
                "AlreadyWhitelisted"
              );
            });
            it("...should change the whitelist status of the wallet to true ", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await StoneRealEstateInstance.addToWhitelist(user1, {
                from: admin,
              });
              expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                .true;
            });
            it("...should emit an AddedToWhitelist event", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              const receipt = await StoneRealEstateInstance.addToWhitelist(
                user1,
                {
                  from: admin,
                }
              );
              expectEvent(receipt, "AddedToWhitelist", {
                newWhitelistedWallet: user1,
              });
            });
          });
          context("when called from others", () => {
            it("...should revert because not owner", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.addToWhitelist(user1, { from: user1 }),
                "NotAdminOrOwner"
              );
            });
          });
        });
        describe("addMultipleToWhitelist", () => {
          context("when called from owner", () => {
            context("when 0 address in param array", () => {
              it("...should revert for empty array reason", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.addMultipleToWhitelist([], {
                    from: owner,
                  }),
                  "EmptyArray"
                );
              });
            });
            context("when 1 address in param array", () => {
              it("...should change the whitelist status of the wallet to true", async () => {
                await StoneRealEstateInstance.addMultipleToWhitelist([user1], {
                  from: owner,
                });
                expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                  .true;
              });
              it("...should emit an AddedToWhitelist event", async () => {
                const receipt =
                  await StoneRealEstateInstance.addMultipleToWhitelist(
                    [user1],
                    { from: owner }
                  );
                expectEvent(receipt, "AddedToWhitelist", {
                  newWhitelistedWallet: user1,
                });
              });
            });
            context("when 2 address in param array", () => {
              it("...should change the whitelist status of the first wallet to true", async () => {
                await StoneRealEstateInstance.addMultipleToWhitelist(
                  multipleWalletArray,
                  { from: owner }
                );
                expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                  .true;
              });
              it("...should change the whitelist status of the second wallet to true", async () => {
                await StoneRealEstateInstance.addMultipleToWhitelist(
                  multipleWalletArray,
                  { from: owner }
                );
                expect(await StoneRealEstateInstance.isWhitelist(user2)).to.be
                  .true;
              });
              it("...should emit an AddedToWhitelist event for the first wallet", async () => {
                const receipt =
                  await StoneRealEstateInstance.addMultipleToWhitelist(
                    multipleWalletArray,
                    { from: owner }
                  );
                expectEvent(receipt, "AddedToWhitelist", {
                  newWhitelistedWallet: user1,
                });
              });
              it("...should emit an AddedToWhitelist event for the second wallet", async () => {
                const receipt =
                  await StoneRealEstateInstance.addMultipleToWhitelist(
                    multipleWalletArray,
                    { from: owner }
                  );
                expectEvent(receipt, "AddedToWhitelist", {
                  newWhitelistedWallet: user2,
                });
              });
            });
            context(
              "when 2 address in param array but second address is already whitelisted",
              () => {
                it("...should change the whitelist status of the first wallet to true", async () => {
                  await StoneRealEstateInstance.addToWhitelist(user2, {
                    from: owner,
                  }),
                    await StoneRealEstateInstance.addMultipleToWhitelist(
                      multipleWalletArray,
                      { from: owner }
                    );
                  expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                    .true;
                });
                it("...should let the whitelist status of the second wallet to true", async () => {
                  await StoneRealEstateInstance.addToWhitelist(user2, {
                    from: owner,
                  }),
                    await StoneRealEstateInstance.addMultipleToWhitelist(
                      multipleWalletArray,
                      { from: owner }
                    );
                  expect(await StoneRealEstateInstance.isWhitelist(user2)).to.be
                    .true;
                });
                it("...should emit an AddedToWhitelist event for the first wallet", async () => {
                  const receipt =
                    await StoneRealEstateInstance.addMultipleToWhitelist(
                      multipleWalletArray,
                      { from: owner }
                    );
                  expectEvent(receipt, "AddedToWhitelist", {
                    newWhitelistedWallet: user1,
                  });
                });
              }
            );
            context(
              "when 1 address in param but address is already whitelisted",
              () => {
                it("...should not emit an AddedToWhitelist event", async () => {
                  await StoneRealEstateInstance.addToWhitelist(user1, {
                    from: owner,
                  });
                  const receipt =
                    await StoneRealEstateInstance.addMultipleToWhitelist(
                      [user1],
                      { from: owner }
                    );
                  expectEvent.notEmitted(receipt, "AddedToWhitelist");
                });
              }
            );
          });
          context("when called from admin", () => {
            context("when 0 address in param array", () => {
              it("...should revert for empty array reason", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.addMultipleToWhitelist([], {
                    from: admin,
                  }),
                  "EmptyArray"
                );
              });
            });
            context("when 1 address in param array", () => {
              it("...should change the whitelist status of the wallet to true", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                await StoneRealEstateInstance.addMultipleToWhitelist([user1], {
                  from: admin,
                });
                expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                  .true;
              });
              it("...should emit an AddedToWhitelist event", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                const receipt =
                  await StoneRealEstateInstance.addMultipleToWhitelist(
                    [user1],
                    { from: admin }
                  );
                expectEvent(receipt, "AddedToWhitelist", {
                  newWhitelistedWallet: user1,
                });
              });
            });
            context("when 2 address in param array", () => {
              it("...should change the whitelist status of the first wallet to true", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                await StoneRealEstateInstance.addMultipleToWhitelist(
                  multipleWalletArray,
                  { from: admin }
                );
                expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                  .true;
              });
              it("...should change the whitelist status of the second wallet to true", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                await StoneRealEstateInstance.addMultipleToWhitelist(
                  multipleWalletArray,
                  { from: admin }
                );
                expect(await StoneRealEstateInstance.isWhitelist(user2)).to.be
                  .true;
              });
              it("...should emit an AddedToWhitelist event for the first wallet", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                const receipt =
                  await StoneRealEstateInstance.addMultipleToWhitelist(
                    multipleWalletArray,
                    { from: admin }
                  );
                expectEvent(receipt, "AddedToWhitelist", {
                  newWhitelistedWallet: user1,
                });
              });
              it("...should emit an AddedToWhitelist event for the second wallet", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                const receipt =
                  await StoneRealEstateInstance.addMultipleToWhitelist(
                    multipleWalletArray,
                    { from: admin }
                  );
                expectEvent(receipt, "AddedToWhitelist", {
                  newWhitelistedWallet: user2,
                });
              });
            });
            context(
              "when 2 address in param array but second address is already whitelisted",
              () => {
                it("...should change the whitelist status of the first wallet to true", async () => {
                  await StoneRealEstateInstance.addToAdmin(admin, {
                    from: owner,
                  });
                  await StoneRealEstateInstance.addToWhitelist(user2, {
                    from: admin,
                  }),
                    await StoneRealEstateInstance.addMultipleToWhitelist(
                      multipleWalletArray,
                      { from: admin }
                    );
                  expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                    .true;
                });
                it("...should let the whitelist status of the second wallet to true", async () => {
                  await StoneRealEstateInstance.addToAdmin(admin, {
                    from: owner,
                  });
                  await StoneRealEstateInstance.addToWhitelist(user2, {
                    from: admin,
                  }),
                    await StoneRealEstateInstance.addMultipleToWhitelist(
                      multipleWalletArray,
                      { from: admin }
                    );
                  expect(await StoneRealEstateInstance.isWhitelist(user2)).to.be
                    .true;
                });
                it("...should emit an AddedToWhitelist event for the first wallet", async () => {
                  await StoneRealEstateInstance.addToAdmin(admin, {
                    from: owner,
                  });
                  const receipt =
                    await StoneRealEstateInstance.addMultipleToWhitelist(
                      multipleWalletArray,
                      { from: admin }
                    );
                  expectEvent(receipt, "AddedToWhitelist", {
                    newWhitelistedWallet: user1,
                  });
                });
              }
            );
            context(
              "when 1 address in param but address is already whitelisted",
              () => {
                it("...should not emit an AddedToWhitelist event", async () => {
                  await StoneRealEstateInstance.addToAdmin(admin, {
                    from: owner,
                  });
                  await StoneRealEstateInstance.addToWhitelist(user1, {
                    from: admin,
                  });
                  const receipt =
                    await StoneRealEstateInstance.addMultipleToWhitelist(
                      [user1],
                      { from: admin }
                    );
                  expectEvent.notEmitted(receipt, "AddedToWhitelist");
                });
              }
            );
          });
          context("when called from others", () => {
            context("when 0 address in param array", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.addMultipleToWhitelist([], {
                    from: user1,
                  }),
                  "NotAdminOrOwner"
                );
              });
            });
            context("when 1 address in param array", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.addMultipleToWhitelist([user1], {
                    from: user1,
                  }),
                  "NotAdminOrOwner"
                );
              });
            });
            context("when 2 address in param array", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.addMultipleToWhitelist(
                    multipleWalletArray,
                    { from: user1 }
                  ),
                  "NotAdminOrOwner"
                );
              });
            });
            context(
              "when 2 address in param array but second address is already whitelisted",
              () => {
                it("...should revert because not owner", async () => {
                  await expectRevertCustomError(
                    StoneRealEstate,
                    StoneRealEstateInstance.addMultipleToWhitelist(
                      multipleWalletArray,
                      { from: user1 }
                    ),
                    "NotAdminOrOwner"
                  );
                });
              }
            );
            context(
              "when 1 address in param but address is already whitelisted",
              () => {
                it("...should revert because not owner", async () => {
                  await expectRevertCustomError(
                    StoneRealEstate,
                    StoneRealEstateInstance.addMultipleToWhitelist([user1], {
                      from: user1,
                    }),
                    "NotAdminOrOwner"
                  );
                });
              }
            );
          });
        });
        describe("removeFromWhitelist", () => {
          context("when called from owner", () => {
            it("...should revert if wallet is already not whitelisted", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.removeFromWhitelist(user1, {
                  from: owner,
                }),
                "WalletNotWhitelisted"
              );
            });
            it("...should change the whitelist status of the wallet to false", async () => {
              await StoneRealEstateInstance.addToWhitelist(user1, {
                from: owner,
              });
              await StoneRealEstateInstance.removeFromWhitelist(user1, {
                from: owner,
              });
              expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                .false;
            });
            it("...should emit RemovedFromWhitelist event", async () => {
              await StoneRealEstateInstance.addToWhitelist(user1, {
                from: owner,
              });
              const receipt = await StoneRealEstateInstance.removeFromWhitelist(
                user1,
                {
                  from: owner,
                }
              );
              expectEvent(receipt, "RemovedFromWhitelist", {
                removedWhitelistedWallet: user1,
              });
            });
          });
          context("when called from admin", () => {
            it("...should revert if wallet is already not whitelisted", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, {
                from: owner,
              });
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.removeFromWhitelist(user1, {
                  from: admin,
                }),
                "WalletNotWhitelisted"
              );
            });
            it("...should change the whitelist status of the wallet to false", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, {
                from: owner,
              });
              await StoneRealEstateInstance.addToWhitelist(user1, {
                from: owner,
              });
              await StoneRealEstateInstance.removeFromWhitelist(user1, {
                from: admin,
              });
              expect(await StoneRealEstateInstance.isWhitelist(user1)).to.be
                .false;
            });
            it("...should emit RemovedFromWhitelist event", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, {
                from: owner,
              });
              await StoneRealEstateInstance.addToWhitelist(user1, {
                from: owner,
              });
              const receipt = await StoneRealEstateInstance.removeFromWhitelist(
                user1,
                {
                  from: admin,
                }
              );
              expectEvent(receipt, "RemovedFromWhitelist", {
                removedWhitelistedWallet: user1,
              });
            });
          });
          context("when called from others", () => {
            it("...should revert because not owner", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.removeFromWhitelist(user1, {
                  from: user1,
                }),
                "NotAdminOrOwner"
              );
            });
          });
        });
        describe("addToAdmin", () => {
          context("when called from owner", () => {
            it("...should revert if user is already an admin", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.addToAdmin(admin, { from: owner }),
                "AlreadyAdmin"
              );
            });
            it("...should change the admin status of the wallet to true ", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              expect(await StoneRealEstateInstance.isAdmin(admin)).to.be.true;
            });
            it("...should emit an AddToAdmin event", async () => {
              const receipt = await StoneRealEstateInstance.addToAdmin(admin, {
                from: owner,
              });
              expectEvent(receipt, "AddToAdmin", { newAdmin: admin });
            });
          });
          context("when called from admin", () => {
            it("...should revert because not owner", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await expectRevert(
                StoneRealEstateInstance.addToAdmin(admin, { from: admin }),
                "Ownable: caller is not the owner"
              );
            });
          });
          context("when called from others", () => {
            it("...should revert because not owner", async () => {
              await expectRevert(
                StoneRealEstateInstance.addToAdmin(user1, { from: user1 }),
                "Ownable: caller is not the owner"
              );
            });
          });
        });
        describe("removeFromAdmin", () => {
          context("when called from owner", () => {
            it("...should revert if wallet is already not admin", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.removeFromAdmin(user1, {
                  from: owner,
                }),
                "WalletNotAdmin"
              );
            });
            it("...should change the admin status of the wallet to false", async () => {
              await StoneRealEstateInstance.addToAdmin(user1, {
                from: owner,
              });
              await StoneRealEstateInstance.removeFromAdmin(user1, {
                from: owner,
              });
              expect(await StoneRealEstateInstance.isAdmin(user1)).to.be.false;
            });
            it("...should emit RemovedFromAdmin event", async () => {
              await StoneRealEstateInstance.addToAdmin(user1, {
                from: owner,
              });
              const receipt = await StoneRealEstateInstance.removeFromAdmin(
                user1,
                {
                  from: owner,
                }
              );
              expectEvent(receipt, "RemovedFromAdmin", {
                oldAdmin: user1,
              });
            });
          });
          context("when called from admin", () => {
            it("...should revert because not admin or owner", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await expectRevert(
                StoneRealEstateInstance.removeFromAdmin(user1, { from: admin }),
                "Ownable: caller is not the owner"
              );
            });
          });
          context("when called from others", () => {
            it("...should revert because not admin or owner", async () => {
              await expectRevert(
                StoneRealEstateInstance.removeFromAdmin(user2, { from: user1 }),
                "Ownable: caller is not the owner"
              );
            });
          });
        });
        describe("setPrice", () => {
          context("when called from owner", () => {
            it("...should revert if new price is 0", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setPrice(0, {
                  from: owner,
                }),
                "PriceMustBeGreaterThan0"
              );
            });
            it("...should revert if new price is equal to price", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setPrice(tenUSDC, {
                  from: owner,
                }),
                "PriceIsSameAsCurrent"
              );
            });
            it("...should change price to 1 usdc", async () => {
              await StoneRealEstateInstance.setPrice(oneUSDC, { from: owner });
              expect(
                new BN(await StoneRealEstateInstance.price())
              ).to.be.bignumber.equal(new BN(oneUSDC));
            });
            it("...should emit SetNewPrice event", async () => {
              const receipt = await StoneRealEstateInstance.setPrice(oneUSDC, {
                from: owner,
              });
              expectEvent(receipt, "SetNewPrice", {
                newPrice: new BN(oneUSDC),
              });
            });
          });
          context("when called from admin", () => {
            it("...should revert if new price is 0", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setPrice(0, {
                  from: admin,
                }),
                "PriceMustBeGreaterThan0"
              );
            });
            it("...should revert if new price is equal to price", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setPrice(tenUSDC, {
                  from: admin,
                }),
                "PriceIsSameAsCurrent"
              );
            });
            it("...should change price to 1 usdc", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await StoneRealEstateInstance.setPrice(oneUSDC, { from: admin });
              expect(
                new BN(await StoneRealEstateInstance.price())
              ).to.be.bignumber.equal(new BN(oneUSDC));
            });
            it("...should emit SetNewPrice event", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              const receipt = await StoneRealEstateInstance.setPrice(oneUSDC, {
                from: admin,
              });
              expectEvent(receipt, "SetNewPrice", {
                newPrice: new BN(oneUSDC),
              });
            });
          });
          context("when called from others", () => {
            context("when trying to set price to 0", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.setPrice(0, {
                    from: user1,
                  }),
                  "NotAdminOrOwner"
                );
              });
            });
            context("when trying to set price to same price", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.setPrice(tenUSDC, {
                    from: user1,
                  }),
                  "NotAdminOrOwner"
                );
              });
            });
            context("when trying to set price to other price", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.setPrice(oneUSDC, {
                    from: user1,
                  }),
                  "NotAdminOrOwner"
                );
              });
            });
          });
        });
        describe("setMintFees", () => {
          context("when called from owner", () => {
            it("...should revert if new mint fees is 0", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setMintFees(0, {
                  from: owner,
                }),
                "MintFeesMustBeGreaterThan0"
              );
            });
            it("...should revert if new mint fees is equal to mintFees", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setMintFees(mintFees, {
                  from: owner,
                }),
                "MintFeesIsSameAsCurrent"
              );
            });
            it("...should change mint fees to 1 usdc", async () => {
              await StoneRealEstateInstance.setMintFees(oneUSDC, {
                from: owner,
              });
              expect(
                new BN(await StoneRealEstateInstance.mintFees())
              ).to.be.bignumber.equal(new BN(oneUSDC));
            });
            it("...should emit SetNewMintFees event", async () => {
              const receipt = await StoneRealEstateInstance.setMintFees(
                oneUSDC,
                {
                  from: owner,
                }
              );
              expectEvent(receipt, "SetNewMintFees", {
                newMintFees: new BN(oneUSDC),
              });
            });
          });
          context("when called from admin", () => {
            it("...should revert if new mint fees is 0", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setMintFees(0, {
                  from: admin,
                }),
                "MintFeesMustBeGreaterThan0"
              );
            });
            it("...should revert if new mint fees is equal to mintFees", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setMintFees(mintFees, {
                  from: admin,
                }),
                "MintFeesIsSameAsCurrent"
              );
            });
            it("...should change mint fees to 1 usdc", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await StoneRealEstateInstance.setMintFees(oneUSDC, {
                from: admin,
              });
              expect(
                new BN(await StoneRealEstateInstance.mintFees())
              ).to.be.bignumber.equal(new BN(oneUSDC));
            });
            it("...should emit SetNewMintFees event", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              const receipt = await StoneRealEstateInstance.setMintFees(
                oneUSDC,
                {
                  from: admin,
                }
              );
              expectEvent(receipt, "SetNewMintFees", {
                newMintFees: new BN(oneUSDC),
              });
            });
          });
          context("when called from others", () => {
            context("when trying to set price to 0", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.setMintFees(0, {
                    from: user1,
                  }),
                  "NotAdminOrOwner"
                );
              });
            });
            context("when trying to set price to same price", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.setMintFees(tenUSDC, {
                    from: user1,
                  }),
                  "NotAdminOrOwner"
                );
              });
            });
            context("when trying to set price to other price", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.setMintFees(oneUSDC, {
                    from: user1,
                  }),
                  "NotAdminOrOwner"
                );
              });
            });
          });
        });
        describe("setTransferFees", () => {
          context("when called from owner", () => {
            it("...should revert if new transfer fees are equal to 0", async () => {
              expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setTransferFees(0, { from: owner }),
                "TransferFeesMustBeGreaterThan0"
              );
            });
            it("...should revert if new transfer fees are equal to current transfer fees", async () => {
              expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setTransferFees(oneUSDC, {
                  from: owner,
                }),
                "TransferFeesIsSameAsCurrent"
              );
            });
            it("...should change transfer fees to 10 usdc", async () => {
              await StoneRealEstateInstance.setTransferFees(tenUSDC, {
                from: owner,
              });
              expect(
                new BN(await StoneRealEstateInstance.transferFees())
              ).to.be.bignumber.equal(new BN(tenUSDC));
            });
            it("...should emit SetNewTransferFees event", async () => {
              const receipt = await StoneRealEstateInstance.setTransferFees(
                tenUSDC,
                {
                  from: owner,
                }
              );
              expectEvent(receipt, "SetNewTransferFees", {
                newTransferFees: new BN(tenUSDC),
              });
            });
          });
          context("when called from admin", () => {
            it("...should revert if new transfer fees are equal to 0", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setTransferFees(0, { from: admin }),
                "TransferFeesMustBeGreaterThan0"
              );
            });
            it("...should revert if new transfer fees are equal to current transfer fees", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setTransferFees(oneUSDC, {
                  from: admin,
                }),
                "TransferFeesIsSameAsCurrent"
              );
            });
            it("...should change transfer fees to 10 usdc", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await StoneRealEstateInstance.setTransferFees(tenUSDC, {
                from: admin,
              });
              expect(
                new BN(await StoneRealEstateInstance.transferFees())
              ).to.be.bignumber.equal(new BN(tenUSDC));
            });
            it("...should emit SetNewTransferFees event", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              const receipt = await StoneRealEstateInstance.setTransferFees(
                tenUSDC,
                {
                  from: admin,
                }
              );
              expectEvent(receipt, "SetNewTransferFees", {
                newTransferFees: new BN(tenUSDC),
              });
            });
          });
          context("when called from others", () => {
            context("when trying to set transfer fees to 0", () => {
              it("...should revert because not owner", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.setTransferFees(0, {
                    from: user1,
                  }),
                  "NotAdminOrOwner"
                );
              });
            });
            context(
              "when trying to set transfer fees to same transfer fees",
              () => {
                it("...should revert because not owner", async () => {
                  await expectRevertCustomError(
                    StoneRealEstate,
                    StoneRealEstateInstance.setTransferFees(oneUSDC, {
                      from: user1,
                    }),
                    "NotAdminOrOwner"
                  );
                });
              }
            );
            context(
              "when trying to set transfer fees to other transfer fees",
              () => {
                it("...should revert because not owner", async () => {
                  await expectRevertCustomError(
                    StoneRealEstate,
                    StoneRealEstateInstance.setTransferFees(tenUSDC, {
                      from: user1,
                    }),
                    "NotAdminOrOwner"
                  );
                });
              }
            );
          });
        });
        describe("setOwnerFundReceiptWallet", () => {
          context("when called from owner", () => {
            it("...should revert if param address equal to ZERO_ADDRESS", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setOwnerFundReceiptWallet(
                  ZERO_ADDRESS,
                  {
                    from: owner,
                  }
                ),
                "ShouldBeAValidAddress"
              );
            });
            it("...should revert if param address equal to current", async () => {
              const ownerFundReceiptWallet =
                await StoneRealEstateInstance.ownerFundReceiptWallet();
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setOwnerFundReceiptWallet(
                  ownerFundReceiptWallet,
                  { from: owner }
                ),
                "ShouldBeADifferentAddressThanCurrent"
              );
            });
            it("...should change owner fund receipt wallet", async () => {
              await StoneRealEstateInstance.setOwnerFundReceiptWallet(
                newOwnerReceiptWallet,
                { from: owner }
              );
              expect(
                await StoneRealEstateInstance.ownerFundReceiptWallet()
              ).equal(newOwnerReceiptWallet);
            });
            it("...should emit SetNewOwnerFundReceiptWallet event", async () => {
              const receipt =
                await StoneRealEstateInstance.setOwnerFundReceiptWallet(
                  newOwnerReceiptWallet,
                  { from: owner }
                );
              expectEvent(receipt, "SetNewOwnerFundReceiptWallet", {
                newOwnerFundReceiptWallet: newOwnerReceiptWallet,
              });
            });
          });
          context("when called from admin", () => {
            context("when address param is ZERO_ADDRESS", () => {
              it("...should revert because not owner", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                await expectRevert(
                  StoneRealEstateInstance.setOwnerFundReceiptWallet(
                    ZERO_ADDRESS,
                    {
                      from: admin,
                    }
                  ),
                  "Ownable: caller is not the owner"
                );
              });
            });
            context("when address param is current address", () => {
              it("...should revert because not owner", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                const ownerFundReceiptWallet =
                  await StoneRealEstateInstance.ownerFundReceiptWallet();
                await expectRevert(
                  StoneRealEstateInstance.setOwnerFundReceiptWallet(
                    ownerFundReceiptWallet,
                    {
                      from: admin,
                    }
                  ),
                  "Ownable: caller is not the owner"
                );
              });
            });
            context("when address param is others address", () => {
              it("...should revert because not owner", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                await expectRevert(
                  StoneRealEstateInstance.setOwnerFundReceiptWallet(
                    newOwnerReceiptWallet,
                    {
                      from: admin,
                    }
                  ),
                  "Ownable: caller is not the owner"
                );
              });
            });
          });
          context("when called from others", () => {
            context("when address param is ZERO_ADDRESS", () => {
              it("...should revert because not owner", async () => {
                await expectRevert(
                  StoneRealEstateInstance.setOwnerFundReceiptWallet(
                    ZERO_ADDRESS,
                    {
                      from: user1,
                    }
                  ),
                  "Ownable: caller is not the owner"
                );
              });
            });
            context("when address param is current address", () => {
              it("...should revert because not owner", async () => {
                const ownerFundReceiptWallet =
                  await StoneRealEstateInstance.ownerFundReceiptWallet();
                await expectRevert(
                  StoneRealEstateInstance.setOwnerFundReceiptWallet(
                    ownerFundReceiptWallet,
                    {
                      from: user1,
                    }
                  ),
                  "Ownable: caller is not the owner"
                );
              });
            });
            context("when address param is others address", () => {
              it("...should revert because not owner", async () => {
                await expectRevert(
                  StoneRealEstateInstance.setOwnerFundReceiptWallet(
                    newOwnerReceiptWallet,
                    {
                      from: user1,
                    }
                  ),
                  "Ownable: caller is not the owner"
                );
              });
            });
          });
        });
        describe("setUsdcAddress", () => {
          context("when called from owner", () => {
            it("...should revert if param address equal to ZERO_ADDRESS", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setUsdcAddress(ZERO_ADDRESS, {
                  from: owner,
                }),
                "ShouldBeAValidAddress"
              );
            });
            it("...should revert if param address equal to current", async () => {
              const usdcAddress = await StoneRealEstateInstance.usdcAddress();
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.setUsdcAddress(usdcAddress, {
                  from: owner,
                }),
                "ShouldBeADifferentAddressThanCurrent"
              );
            });
            it("...should change usdc address", async () => {
              await StoneRealEstateInstance.setUsdcAddress(newUsdcAddress, {
                from: owner,
              });
              expect(await StoneRealEstateInstance.usdcAddress()).equal(
                newUsdcAddress
              );
            });
            it("...should emit SetNewUsdcAddress event", async () => {
              const receipt = await StoneRealEstateInstance.setUsdcAddress(
                newUsdcAddress,
                { from: owner }
              );
              expectEvent(receipt, "SetNewUsdcAddress", {
                newUsdcAddress: newUsdcAddress,
              });
            });
          });
          context("when called from admin", () => {
            context("when address param is ZERO_ADDRESS", () => {
              it("...should revert because not owner", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                await expectRevert(
                  StoneRealEstateInstance.setUsdcAddress(ZERO_ADDRESS, {
                    from: admin,
                  }),
                  "Ownable: caller is not the owner"
                );
              });
            });
            context("when address param is current address", () => {
              it("...should revert because not owner", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                const usdcAddress = await StoneRealEstateInstance.usdcAddress();
                await expectRevert(
                  StoneRealEstateInstance.setUsdcAddress(usdcAddress, {
                    from: admin,
                  }),
                  "Ownable: caller is not the owner"
                );
              });
            });
            context("when address param is others address", () => {
              it("...should revert because not owner", async () => {
                await StoneRealEstateInstance.addToAdmin(admin, {
                  from: owner,
                });
                await expectRevert(
                  StoneRealEstateInstance.setUsdcAddress(
                    newOwnerReceiptWallet,
                    {
                      from: admin,
                    }
                  ),
                  "Ownable: caller is not the owner"
                );
              });
            });
          });
          context("when called from others", () => {
            context("when address param is ZERO_ADDRESS", () => {
              it("...should revert because not owner", async () => {
                await expectRevert(
                  StoneRealEstateInstance.setUsdcAddress(ZERO_ADDRESS, {
                    from: user1,
                  }),
                  "Ownable: caller is not the owner"
                );
              });
            });
            context("when address param is current address", () => {
              it("...should revert because not owner", async () => {
                const usdcAddress = await StoneRealEstateInstance.usdcAddress();
                await expectRevert(
                  StoneRealEstateInstance.setUsdcAddress(usdcAddress, {
                    from: user1,
                  }),
                  "Ownable: caller is not the owner"
                );
              });
            });
            context("when address param is others address", () => {
              it("...should revert because not owner", async () => {
                await expectRevert(
                  StoneRealEstateInstance.setUsdcAddress(
                    newOwnerReceiptWallet,
                    {
                      from: user1,
                    }
                  ),
                  "Ownable: caller is not the owner"
                );
              });
            });
          });
        });
      });
    });
    context("custom", () => {
      context("custom contract custom", () => {
        describe("mint", () => {
          context("when the 'to' is not whitelist", () => {
            it("...should revert because WalletNotWhitelisted", async () => {
              await expectRevertCustomError(
                StoneRealEstate,
                StoneRealEstateInstance.mint(user1, 1, {
                  from: owner,
                }),
                "WalletNotWhitelisted"
              );
            });
            context('when the "to" is whitelist', () => {
              context("when called from non whitelist", () => {
                it("...should revert because CallerIsNotWhitelisted", async () => {
                  await StoneRealEstateInstance.addToWhitelist(user1, {
                    from: owner,
                  });
                  await expectRevertCustomError(
                    StoneRealEstate,
                    StoneRealEstateInstance.mint(user1, 1, {
                      from: owner,
                    }),
                    "CallerIsNotWhitelisted"
                  );
                });
              });
              context("when called from whitelist", () => {
                context('when the "to" address is ZERO_ADDRESS', () => {
                  it("...should revert because ShouldBeAValidAddress", async () => {
                    await StoneRealEstateInstance.addToWhitelist(ZERO_ADDRESS, {
                      from: owner,
                    });
                    await StoneRealEstateInstance.addToWhitelist(user1, {
                      from: owner,
                    });
                    await expectRevertCustomError(
                      StoneRealEstate,
                      StoneRealEstateInstance.mint(ZERO_ADDRESS, 1, {
                        from: user1,
                      }),
                      "ShouldBeAValidAddress"
                    );
                  });
                });
                context('when the "to" address is a valid address', () => {
                  context("when the quantity is 0", () => {
                    it("...should revert because ShouldBeAValidQuantity", async () => {
                      await StoneRealEstateInstance.addToWhitelist(user1, {
                        from: owner,
                      });
                      await expectRevertCustomError(
                        StoneRealEstate,
                        StoneRealEstateInstance.mint(user1, 0, {
                          from: user1,
                        }),
                        "ShouldBeAValidQuantity"
                      );
                    });
                  });
                  context("when the quantity is valid", () => {
                    context("when quantity asked exceed max supply", () => {
                      it("...should revert because MaxSupplyReachedOrTooMuchNftsAsked", async () => {
                        await StoneRealEstateInstance.addToWhitelist(user1, {
                          from: owner,
                        });
                        await expectRevertCustomError(
                          StoneRealEstate,
                          StoneRealEstateInstance.mint(user1, 101, {
                            from: user1,
                          }),
                          "MaxSupplyReachedOrTooMuchNftsAsked"
                        );
                      });
                    });
                    context("when quantity asked is valid", () => {
                      context(
                        "when allowance is less than the total price",
                        () => {
                          it("...should revert because NotEnoughUSDCAllowed", async () => {
                            await StoneRealEstateInstance.addToWhitelist(
                              user1,
                              { from: owner }
                            );
                            await expectRevertCustomError(
                              StoneRealEstate,
                              StoneRealEstateInstance.mint(user1, 1, {
                                from: user1,
                              }),
                              "NotEnoughUSDCAllowed"
                            );
                          });
                        }
                      );
                      context("when allowance is valid", () => {
                        context(
                          "when balance is less than the total price",
                          () => {
                            // test
                            it("...should revert because NotEnoughUSDCInBalance", async () => {
                              await StoneRealEstateInstance.addToWhitelist(
                                user1,
                                { from: owner }
                              );

                              await FiatTokenV2_1ViaProxy.transfer(
                                user1,
                                tenUSDC + mintFees,
                                {
                                  from: owner,
                                }
                              );
                              await FiatTokenV2_1ViaProxy.approve(
                                StoneRealEstateInstance.address,
                                tenUSDC + mintFees,
                                { from: user1 }
                              );
                              await FiatTokenV2_1ViaProxy.transfer(
                                owner,
                                tenUSDC + mintFees,
                                {
                                  from: user1,
                                }
                              );

                              await expectRevertCustomError(
                                StoneRealEstate,
                                StoneRealEstateInstance.mint(user1, 1, {
                                  from: user1,
                                }),
                                "NotEnoughUSDCInBalance"
                              );
                            });
                          }
                        );
                        context("when balance is valid", () => {
                          context("when mint 1 nft", () => {
                            it("...should have transferred the total price to ownerFundReceiptWallet", async () => {
                              await StoneRealEstateInstance.addToWhitelist(
                                user1,
                                { from: owner }
                              );

                              await FiatTokenV2_1ViaProxy.transfer(
                                user1,
                                tenUSDC + mintFees,
                                {
                                  from: owner,
                                }
                              );
                              await FiatTokenV2_1ViaProxy.approve(
                                StoneRealEstateInstance.address,
                                tenUSDC + mintFees,
                                { from: user1 }
                              );

                              await StoneRealEstateInstance.mint(user1, 1, {
                                from: user1,
                              });
                              expect(
                                new BN(
                                  await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                )
                              ).to.be.bignumber.equal(new BN(thousandUSDC));
                            });
                            it("...should have transferred the nft", async () => {
                              await StoneRealEstateInstance.addToWhitelist(
                                user1,
                                { from: owner }
                              );

                              await FiatTokenV2_1ViaProxy.transfer(
                                user1,
                                tenUSDC + mintFees,
                                {
                                  from: owner,
                                }
                              );
                              await FiatTokenV2_1ViaProxy.approve(
                                StoneRealEstateInstance.address,
                                tenUSDC + mintFees,
                                { from: user1 }
                              );

                              await StoneRealEstateInstance.mint(user1, 1, {
                                from: user1,
                              });
                              expect(
                                await StoneRealEstateInstance.ownerOf(tokenId0)
                              ).equal(user1);
                            });
                            it("...should have emit Mint event", async () => {
                              await StoneRealEstateInstance.addToWhitelist(
                                user1,
                                { from: owner }
                              );

                              await FiatTokenV2_1ViaProxy.transfer(
                                user1,
                                tenUSDC + mintFees,
                                {
                                  from: owner,
                                }
                              );
                              await FiatTokenV2_1ViaProxy.approve(
                                StoneRealEstateInstance.address,
                                tenUSDC + mintFees,
                                { from: user1 }
                              );
                              // total supply is used because _nextTokenId is private. as there is no burn and start tokenId from 0 it's the same.
                              const firstTokenIdMinted =
                                await StoneRealEstateInstance.totalSupply();
                              const receipt =
                                await StoneRealEstateInstance.mint(user1, 1, {
                                  from: user1,
                                });
                              expectEvent(receipt, "Mint", {
                                minter: user1,
                                receiver: user1,
                                quantity: new BN(1),
                                totalPrice: new BN(tenUSDC + mintFees),
                                totalMintFees: new BN(mintFees * 1),
                                firstTokenIdMinted: new BN(firstTokenIdMinted),
                              });
                            });
                          });
                          context("when mint 2 nft", () => {
                            it("...should have transferred the total price to ownerFundReceiptWallet", async () => {
                              await StoneRealEstateInstance.addToWhitelist(
                                user1,
                                { from: owner }
                              );

                              await FiatTokenV2_1ViaProxy.transfer(
                                user1,
                                twentyUSDC + 2 * mintFees,
                                {
                                  from: owner,
                                }
                              );
                              await FiatTokenV2_1ViaProxy.approve(
                                StoneRealEstateInstance.address,
                                twentyUSDC + 2 * mintFees,
                                { from: user1 }
                              );

                              await StoneRealEstateInstance.mint(user1, 2, {
                                from: user1,
                              });
                              expect(
                                new BN(
                                  await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                )
                              ).to.be.bignumber.equal(new BN(thousandUSDC));
                            });
                            it("...should have transferred the nft", async () => {
                              await StoneRealEstateInstance.addToWhitelist(
                                user1,
                                { from: owner }
                              );

                              await FiatTokenV2_1ViaProxy.transfer(
                                user1,
                                twentyUSDC + 2 * mintFees,
                                {
                                  from: owner,
                                }
                              );
                              await FiatTokenV2_1ViaProxy.approve(
                                StoneRealEstateInstance.address,
                                twentyUSDC + 2 * mintFees,
                                { from: user1 }
                              );

                              await StoneRealEstateInstance.mint(user1, 2, {
                                from: user1,
                              });
                              expect(
                                await StoneRealEstateInstance.ownerOf(tokenId0)
                              ).equal(user1);
                              expect(
                                await StoneRealEstateInstance.ownerOf(tokenId1)
                              ).equal(user1);
                            });
                            it("...should have emit Mint event", async () => {
                              await StoneRealEstateInstance.addToWhitelist(
                                user1,
                                { from: owner }
                              );

                              await FiatTokenV2_1ViaProxy.transfer(
                                user1,
                                twentyUSDC + 2 * mintFees,
                                {
                                  from: owner,
                                }
                              );
                              await FiatTokenV2_1ViaProxy.approve(
                                StoneRealEstateInstance.address,
                                twentyUSDC + 2 * mintFees,
                                { from: user1 }
                              );
                              // total supply is used because _nextTokenId is private. as there is no burn and start tokenId from 0 it's the same.
                              const firstTokenIdMinted =
                                await StoneRealEstateInstance.totalSupply();
                              const receipt =
                                await StoneRealEstateInstance.mint(user1, 2, {
                                  from: user1,
                                });
                              expectEvent(receipt, "Mint", {
                                minter: user1,
                                receiver: user1,
                                quantity: new BN(2),
                                totalPrice: new BN(twentyUSDC + 2 * mintFees),
                                totalMintFees: new BN(2 * mintFees),
                                firstTokenIdMinted: new BN(firstTokenIdMinted),
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
        describe("transferFrom", () => {
          context("override the transferFrom from ERC721A", () => {
            context("when the 'to' is not whitelisted", () => {
              it("...should revert because WalletNotWhitelisted", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.transferFrom(owner, user1, tokenId0, {
                    from: owner,
                  }),
                  "WalletNotWhitelisted"
                );
              });
            });
            context("when when the 'to' is whitelisted", () => {
              context("when not enough USDC allowed", () => {
                it("...should revert", async () => {
                  await StoneRealEstateInstance.addToWhitelist(user2, {
                    from: owner,
                  });
                  await expectRevertCustomError(
                    StoneRealEstate,
                    StoneRealEstateInstance.transferFrom(
                      user1,
                      user2,
                      tokenId0,
                      {
                        from: user1,
                      }
                    ),
                    "NotEnoughUSDCAllowed"
                  );
                });
              });
              context("when enough allowed USDC", () => {
                context("when not enough USDC in balance", async () => {
                  it("...should revert", async () => {
                    await StoneRealEstateInstance.addToWhitelist(user2, {
                      from: owner,
                    });
                    await FiatTokenV2_1ViaProxy.transfer(user1, tenUSDC, {
                      from: owner,
                    });
                    await FiatTokenV2_1ViaProxy.approve(
                      StoneRealEstateInstance.address,
                      tenUSDC,
                      { from: user1 }
                    );
                    await FiatTokenV2_1ViaProxy.transfer(owner, tenUSDC, {
                      from: user1,
                    });
                    await expectRevertCustomError(
                      StoneRealEstate,
                      StoneRealEstateInstance.transferFrom(
                        user1,
                        user2,
                        tokenId0,
                        {
                          from: user1,
                        }
                      ),
                      "NotEnoughUSDCInBalance"
                    );
                  });
                  context("when every condition are meet", () => {
                    it("...should change the owner of token id 0", async () => {
                      await StoneRealEstateInstance.addToWhitelist(user1, {
                        from: owner,
                      });
                      await StoneRealEstateInstance.addToWhitelist(user2, {
                        from: owner,
                      });
                      await FiatTokenV2_1ViaProxy.transfer(user1, hundredUSDC, {
                        from: owner,
                      });
                      await FiatTokenV2_1ViaProxy.approve(
                        StoneRealEstateInstance.address,
                        hundredUSDC,
                        { from: user1 }
                      );
                      // mint
                      await StoneRealEstateInstance.mint(user1, 1, {
                        from: user1,
                      });
                      await StoneRealEstateInstance.transferFrom(
                        user1,
                        user2,
                        tokenId0,
                        { from: user1 }
                      );
                      expect(
                        await StoneRealEstateInstance.ownerOf(tokenId0)
                      ).equal(user2);
                    });
                    it("...should emit CustomTransferFrom event", async () => {
                      await StoneRealEstateInstance.addToWhitelist(user1, {
                        from: owner,
                      });
                      await StoneRealEstateInstance.addToWhitelist(user2, {
                        from: owner,
                      });
                      await FiatTokenV2_1ViaProxy.transfer(user1, hundredUSDC, {
                        from: owner,
                      });
                      await FiatTokenV2_1ViaProxy.approve(
                        StoneRealEstateInstance.address,
                        hundredUSDC,
                        { from: user1 }
                      );
                      // mint
                      await StoneRealEstateInstance.mint(user1, 1, {
                        from: user1,
                      });
                      const receipt =
                        await StoneRealEstateInstance.transferFrom(
                          user1,
                          user2,
                          tokenId0,
                          { from: user1 }
                        );
                      expectEvent(receipt, "CustomTransferFrom", {
                        from: user1,
                        to: user2,
                        tokenId: new BN(tokenId0),
                        transferFees: new BN(oneUSDC),
                        ownerFundReceiptWallet: owner,
                      });
                    });
                  });
                });
              });
            });
          });
        });
        describe("sendYield", () => {
          context("when called from owner", () => {
            context("when whitelist array is empty", () => {
              it("...should revert because EmptyArray", async () => {
                await expectRevertCustomError(
                  StoneRealEstate,
                  StoneRealEstateInstance.sendYield(tenUSDC, {
                    from: owner,
                  }),
                  "EmptyArray"
                );
              });
              context("when whitelist array length is more than 0", () => {
                context("when allowance is less than amount", () => {
                  it("...should revert because NotEnoughUSDCAllowed, it's over 9000!", async () => {
                    await StoneRealEstateInstance.addMultipleToWhitelist(
                      multipleWalletArray,
                      { from: owner }
                    );
                    await expectRevertCustomError(
                      StoneRealEstate,
                      StoneRealEstateInstance.sendYield(nineThousandUSDC, {
                        from: owner,
                      }),
                      "NotEnoughUSDCAllowed"
                    );
                  });
                  context("when allowance is match amount", () => {
                    it("...should revert because NotEnoughUSDCInBalance", async () => {
                      await StoneRealEstateInstance.addMultipleToWhitelist(
                        multipleWalletArray,
                        { from: owner }
                      );
                      await FiatTokenV2_1ViaProxy.transfer(
                        user1,
                        thousandUSDC,
                        {
                          from: owner,
                        }
                      );
                      await expectRevertCustomError(
                        StoneRealEstate,
                        StoneRealEstateInstance.sendYield(thousandUSDC, {
                          from: owner,
                        }),
                        "NotEnoughUSDCInBalance"
                      );
                    });
                    context("when balance match amount", () => {
                      context("when no nft minted", () => {
                        it("...should revert because NoNftMintedSoNothingToSend", async () => {
                          await StoneRealEstateInstance.addMultipleToWhitelist(
                            multipleWalletArray,
                            { from: owner }
                          );
                          await expectRevertCustomError(
                            StoneRealEstate,
                            StoneRealEstateInstance.sendYield(thousandUSDC, {
                              from: owner,
                            }),
                            "NoNftMintedSoNothingToSend"
                          );
                        });
                        context("when some nft minted", () => {
                          context(
                            "when 1 address whitelist have mint 1 nft",
                            () => {
                              it("...should have sent 1 usdc to the whitelisted address that own 1 nft", async () => {
                                await StoneRealEstateInstance.addToWhitelist(
                                  user1,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user1 }
                                );
                                await StoneRealEstateInstance.mint(user1, 1, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.sendYield(
                                  hundredUSDC,
                                  { from: owner }
                                );
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user1)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                  )
                                ).to.be.bignumber.equal(new BN(999000000));
                              });
                            }
                          );
                          context(
                            "when 2 addresses whitelist and 1 have mint 1 nft",
                            () => {
                              it("...should have sent 1 usdc to the whitelisted address that own 1 nft", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  multipleWalletArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user1 }
                                );
                                await StoneRealEstateInstance.mint(user1, 1, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.sendYield(
                                  hundredUSDC,
                                  { from: owner }
                                );
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user1)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                  )
                                ).to.be.bignumber.equal(new BN(999000000));
                              });
                            }
                          );
                          context(
                            "when 2 address whitelist and both have mint 1 nft",
                            () => {
                              it("...should have sent 1 usdc to each whitelisted address", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  multipleWalletArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user2,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user1 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user2 }
                                );
                                await StoneRealEstateInstance.mint(user1, 1, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.mint(user2, 1, {
                                  from: user2,
                                });
                                await StoneRealEstateInstance.sendYield(
                                  hundredUSDC,
                                  { from: owner }
                                );
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user1)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user2)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                  )
                                ).to.be.bignumber.equal(new BN(998000000));
                              });
                            }
                          );
                          context(
                            "when 3 address whitelist and 1 have mint 1 nft",
                            () => {
                              it("...should have sent 1 usdc to the whitelisted address that owned the nft", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  bigMultipleArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user1 }
                                );
                                await StoneRealEstateInstance.mint(user1, 1, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.sendYield(
                                  hundredUSDC,
                                  { from: owner }
                                );
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user1)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user2)
                                  )
                                ).to.be.bignumber.equal(new BN(0));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user3)
                                  )
                                ).to.be.bignumber.equal(new BN(0));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                  )
                                ).to.be.bignumber.equal(new BN(999000000));
                              });
                            }
                          );
                          context(
                            "when 3 address whitelist and 2 have mint 1 nft",
                            () => {
                              it("should have sent 1 usdc to the 2 whitelisted address that owned a nft", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  bigMultipleArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user2,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user1 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user2 }
                                );
                                await StoneRealEstateInstance.mint(user1, 1, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.mint(user2, 1, {
                                  from: user2,
                                });
                                await StoneRealEstateInstance.sendYield(
                                  hundredUSDC,
                                  { from: owner }
                                );
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user1)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user2)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user3)
                                  )
                                ).to.be.bignumber.equal(new BN(0));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                  )
                                ).to.be.bignumber.equal(new BN(998000000));
                              });
                            }
                          );
                          context(
                            "when 3 address whitelist and 3 have mint 1 nft",
                            () => {
                              it("should have sent 1 usdc to each whitelisted address that owned a nft", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  bigMultipleArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user2,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user3,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user1 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user2 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user3 }
                                );
                                await StoneRealEstateInstance.mint(user1, 1, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.mint(user2, 1, {
                                  from: user2,
                                });
                                await StoneRealEstateInstance.mint(user3, 1, {
                                  from: user3,
                                });
                                await StoneRealEstateInstance.sendYield(
                                  hundredUSDC,
                                  { from: owner }
                                );
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user1)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user2)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user3)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                  )
                                ).to.be.bignumber.equal(new BN(997000000));
                              });
                              it("...should emit 3 SendYield event", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  bigMultipleArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user2,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user3,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user1 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user2 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user3 }
                                );
                                await StoneRealEstateInstance.mint(user1, 1, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.mint(user2, 1, {
                                  from: user2,
                                });
                                await StoneRealEstateInstance.mint(user3, 1, {
                                  from: user3,
                                });
                                const receipt =
                                  await StoneRealEstateInstance.sendYield(
                                    hundredUSDC,
                                    { from: owner }
                                  );
                                expectEvent(receipt, "SendYield", {
                                  to: user1,
                                  totalRentAmount: new BN(hundredUSDC),
                                  currentYieldSendForToWallet: new BN(1000000),
                                });
                                expectEvent(receipt, "SendYield", {
                                  to: user2,
                                  totalRentAmount: new BN(hundredUSDC),
                                  currentYieldSendForToWallet: new BN(1000000),
                                });
                                expectEvent(receipt, "SendYield", {
                                  to: user3,
                                  totalRentAmount: new BN(hundredUSDC),
                                  currentYieldSendForToWallet: new BN(1000000),
                                });
                              });
                            }
                          );
                          context(
                            "when 3 address whitelist and 2 have mint 1 nft and 1 have mint 5 nft",
                            () => {
                              it("should have sent 5 usdc to the whitelisted address that owned 5 nft and 1 usdc to each whitelisted address that owned a nft ", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  bigMultipleArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC * 5 + 5 * mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user2,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user3,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC * 5 + mintFees * 5,
                                  { from: user1 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user2 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user3 }
                                );
                                await StoneRealEstateInstance.mint(user1, 5, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.mint(user2, 1, {
                                  from: user2,
                                });
                                await StoneRealEstateInstance.mint(user3, 1, {
                                  from: user3,
                                });
                                await StoneRealEstateInstance.sendYield(
                                  hundredUSDC,
                                  { from: owner }
                                );
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user1)
                                  )
                                ).to.be.bignumber.equal(new BN(5000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user2)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user3)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                  )
                                ).to.be.bignumber.equal(new BN(993000000));
                              });
                              it("...should emit 3 SendYield event", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  bigMultipleArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC * 5 + mintFees * 5,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user2,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user3,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC * 5 + mintFees * 5,
                                  { from: user1 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user2 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user3 }
                                );
                                await StoneRealEstateInstance.mint(user1, 5, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.mint(user2, 1, {
                                  from: user2,
                                });
                                await StoneRealEstateInstance.mint(user3, 1, {
                                  from: user3,
                                });
                                const receipt =
                                  await StoneRealEstateInstance.sendYield(
                                    hundredUSDC,
                                    { from: owner }
                                  );
                                expectEvent(receipt, "SendYield", {
                                  to: user1,
                                  totalRentAmount: new BN(hundredUSDC),
                                  currentYieldSendForToWallet: new BN(5000000),
                                });
                                expectEvent(receipt, "SendYield", {
                                  to: user2,
                                  totalRentAmount: new BN(hundredUSDC),
                                  currentYieldSendForToWallet: new BN(1000000),
                                });
                                expectEvent(receipt, "SendYield", {
                                  to: user3,
                                  totalRentAmount: new BN(hundredUSDC),
                                  currentYieldSendForToWallet: new BN(1000000),
                                });
                              });
                            }
                          );
                          context(
                            "when 3 addresses whitelist but 1 have that own 1 nft have been removed from whitelist, 1 have mint 1 nft and 1 have mint 5 nft",
                            () => {
                              it("should not send yield to non whitelisted", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  bigMultipleArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC * 5 + mintFees * 5,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user2,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user3,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC * 5 + mintFees * 5,
                                  { from: user1 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user2 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user3 }
                                );
                                await StoneRealEstateInstance.mint(user1, 5, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.mint(user2, 1, {
                                  from: user2,
                                });
                                await StoneRealEstateInstance.mint(user3, 1, {
                                  from: user3,
                                });
                                await StoneRealEstateInstance.removeFromWhitelist(
                                  user2,
                                  { from: owner }
                                );
                                await StoneRealEstateInstance.sendYield(
                                  hundredUSDC,
                                  { from: owner }
                                );
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user1)
                                  )
                                ).to.be.bignumber.equal(new BN(5000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user2)
                                  )
                                ).to.be.bignumber.equal(new BN(0));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(user3)
                                  )
                                ).to.be.bignumber.equal(new BN(1000000));
                                expect(
                                  new BN(
                                    await FiatTokenV2_1ViaProxy.balanceOf(owner)
                                  )
                                ).to.be.bignumber.equal(new BN(994000000));
                              });
                              it("...should emit 3 SendYield event", async () => {
                                await StoneRealEstateInstance.addMultipleToWhitelist(
                                  bigMultipleArray,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user1,
                                  tenUSDC * 5 + mintFees * 5,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user2,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.transfer(
                                  user3,
                                  tenUSDC + mintFees,
                                  { from: owner }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC * 5 + mintFees * 5,
                                  { from: user1 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user2 }
                                );
                                await FiatTokenV2_1ViaProxy.approve(
                                  StoneRealEstateInstance.address,
                                  tenUSDC + mintFees,
                                  { from: user3 }
                                );
                                await StoneRealEstateInstance.mint(user1, 5, {
                                  from: user1,
                                });
                                await StoneRealEstateInstance.mint(user2, 1, {
                                  from: user2,
                                });
                                await StoneRealEstateInstance.mint(user3, 1, {
                                  from: user3,
                                });
                                await StoneRealEstateInstance.removeFromWhitelist(
                                  user2,
                                  { from: owner }
                                );
                                const receipt =
                                  await StoneRealEstateInstance.sendYield(
                                    hundredUSDC,
                                    { from: owner }
                                  );
                                expectEvent(receipt, "SendYield", {
                                  to: user1,
                                  totalRentAmount: new BN(hundredUSDC),
                                  currentYieldSendForToWallet: new BN(5000000),
                                });
                                expectEvent(receipt, "SendYield", {
                                  to: user3,
                                  totalRentAmount: new BN(hundredUSDC),
                                  currentYieldSendForToWallet: new BN(1000000),
                                });
                              });
                            }
                          );
                        });
                      });
                    });
                  });
                });
              });
            });
          });
          context("when called from admin", () => {
            it("...should revert because not owner", async () => {
              await StoneRealEstateInstance.addToAdmin(admin, { from: owner });
              await expectRevert(
                StoneRealEstateInstance.sendYield(oneUSDC, { from: admin }),
                "Ownable: caller is not the owner"
              );
            });
          });
          context("when called from others", () => {
            it("...should revert because not owner", async () => {
              await expectRevert(
                StoneRealEstateInstance.sendYield(oneUSDC, { from: user1 }),
                "Ownable: caller is not the owner"
              );
            });
          });
        });
      });
    });
  });
});
