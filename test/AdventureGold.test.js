const { BN, ether } = require("@openzeppelin/test-helpers");
const { assertion } = require("@openzeppelin/test-helpers/src/expectRevert");
const { expect } = require("chai");
require("chai").use(require("chai-as-promised")).should();
const chaiBN = require("chai-bn");
require("chai").use(chaiBN(BN));

const AdventureGold = artifacts.require("AdventureGold");
const LootABI = require("./abi/Loot").abi;
const lootContract = new web3.eth.Contract(LootABI, "0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7");

contract('AdventureGold', (accounts) => {
  let adventureGoldInstance;

  before(async () => {
    adventureGoldInstance = await AdventureGold.deployed();
    // Transfer Loot to different accounts for testing purposes
    lootContract.methods.safeTransferFrom("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", accounts[0], 2103).send({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", gasLimit: 800000 });
    lootContract.methods.safeTransferFrom("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", accounts[0], 2062).send({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", gasLimit: 800000 });
    lootContract.methods.safeTransferFrom("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", accounts[0], 1816).send({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", gasLimit: 800000 });
    lootContract.methods.safeTransferFrom("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", accounts[1], 3500).send({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", gasLimit: 800000 });

  });

  after(async () => {
    adventureGoldInstance = null;
  });

  it('Contract names should be correct', async () => {
    assert.equal(await adventureGoldInstance.name(), 'Adventure Gold');
    assert.equal(await adventureGoldInstance.symbol(), 'AGLD');
    assert.equal(await lootContract.methods.name().call(), 'Loot');
  });

  it('Test Loot values', async () => {
    assert.equal(await lootContract.methods.balanceOf('0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78').call(), new BN('20'));
    assert.equal(await lootContract.methods.balanceOf(accounts[0]).call(), new BN('3'));
    assert.equal(await lootContract.methods.balanceOf(accounts[1]).call(), new BN('1'));
  });

  it('Claim by ID', async () => {
    // Claiming an unclaimed ID should succeed 
    checkClaimedID(3500, false);
    await adventureGoldInstance.claimById(3500, { from: accounts[1] }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf(accounts[1]), web3.utils.toWei("10000"));
    checkClaimedID(3500, true);

    // Claiming a claimed ID should fail
    await adventureGoldInstance.claimById(3500, { from: accounts[1] }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");

    // Claiming by a user other than the owner should fail
    await adventureGoldInstance.claimById(1, { from: accounts[1] }).should.eventually.be.rejectedWith("MUST_OWN_TOKEN_ID");
  });

  it('Claim all for owner', async () => {
    // Claiming all for the owner should succeed
    // We'll check the first and last values in the index
    checkClaimedID(7315, false);
    checkClaimedID(5599, false);
    await adventureGoldInstance.claimAllForOwner({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));
    checkClaimedID(7315, true);
    checkClaimedID(5599, true);

    // Claiming after owner has claimed should fail
    await adventureGoldInstance.claimAllForOwner({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));

    // Claiming by a user with no Loot should fail
    await adventureGoldInstance.claimAllForOwner({ from: accounts[9] }).should.eventually.be.rejectedWith("NO_TOKENS_OWNED");
  });

  it('Claim range for owner', async () => {
    // Claiming outside the range should fail
    checkClaimedID(2062, false);
    checkClaimedID(1816, false);
    checkClaimedID(2103, false);
    await adventureGoldInstance.claimRangeForOwner(0, 3, { from: accounts[0] }).should.eventually.be.rejectedWith("INDEX_OUT_OF_RANGE");
    assert.equal(await adventureGoldInstance.balanceOf(accounts[0]), web3.utils.toWei("0"));
    checkClaimedID(2062, false);
    checkClaimedID(1816, false);
    checkClaimedID(2103, false);

    // Claiming range for the owner should succeed
    checkClaimedID(2062, false);
    checkClaimedID(1816, false);
    checkClaimedID(2103, false);
    await adventureGoldInstance.claimRangeForOwner(0, 2, { from: accounts[0] }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf(accounts[0]), web3.utils.toWei("30000"));
    checkClaimedID(2062, true);
    checkClaimedID(1816, true);
    checkClaimedID(2103, true);

    // Claiming after owner has claimed should fail
    await adventureGoldInstance.claimRangeForOwner(0, 2, { from: accounts[0] }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");
    assert.equal(await adventureGoldInstance.balanceOf(accounts[0]), web3.utils.toWei("30000"));

    // Claiming by a user with no Loot should fail
    await adventureGoldInstance.claimRangeForOwner(0, 1, { from: accounts[9] }).should.eventually.be.rejectedWith("NO_TOKENS_OWNED");
  });

  async function checkClaimedID(id, value) {
    assert.equal(await adventureGoldInstance.seasonClaimedByTokenId(0, id), value);
  }
});
