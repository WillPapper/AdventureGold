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
    lootContract.methods.safeTransferFrom("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", accounts[0], 5194).send({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", gasLimit: 800000 });
    lootContract.methods.safeTransferFrom("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", accounts[0], 2883).send({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", gasLimit: 800000 });
    lootContract.methods.safeTransferFrom("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", accounts[0], 2103).send({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", gasLimit: 800000 });
    lootContract.methods.safeTransferFrom("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", accounts[1], 5805).send({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", gasLimit: 800000 });

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
  });

  it('Claim by ID', async () => {
    // Claiming an unclaimed ID should succeed 
    await adventureGoldInstance.claimById(5805, { from: accounts[1] }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf(accounts[1]), web3.utils.toWei("10000"));

    // Claiming a claimed ID should fail
    await adventureGoldInstance.claimById(5805, { from: accounts[1] }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");

    // Claiming by a user other than the owner should fail
    await adventureGoldInstance.claimById(1, { from: accounts[1] }).should.eventually.be.rejectedWith("MUST_OWN_TOKEN_ID");
  });

  it('Claim all for owner', async () => {
    // Claiming all for the owner should succeed
    await adventureGoldInstance.claimAllForOwner({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));

    // Claiming after owner has claimed should fail
    await adventureGoldInstance.claimAllForOwner({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));

    // Claiming by a user with no Loot should fail
    await adventureGoldInstance.claimAllForOwner({ from: accounts[9] }).should.eventually.be.rejectedWith("NO_TOKENS_OWNED");
  });

});