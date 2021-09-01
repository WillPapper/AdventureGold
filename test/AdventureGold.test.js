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

    // Send ETH to the Loot DAO for transaction fees
    web3.eth.sendTransaction({ from: accounts[5], to: "0xcD814C83198C15A542F9A13FAf84D518d1744ED1", value: ether("7") });
    web3.eth.sendTransaction({ from: accounts[6], to: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78", value: ether("7") });
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
    checkClaimedID(3500, false, 0);
    await adventureGoldInstance.claimById(3500, { from: accounts[1] }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf(accounts[1]), web3.utils.toWei("10000"));
    checkClaimedID(3500, true, 0);

    // Claiming a claimed ID should fail
    await adventureGoldInstance.claimById(3500, { from: accounts[1] }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");

    // Claiming by a user other than the owner should fail
    await adventureGoldInstance.claimById(1, { from: accounts[1] }).should.eventually.be.rejectedWith("MUST_OWN_TOKEN_ID");
  });

  it('Claim all for owner', async () => {
    // Claiming all for the owner should succeed
    // We'll check the first and last values in the index
    checkClaimedID(7315, false, 0);
    checkClaimedID(5599, false, 0);
    await adventureGoldInstance.claimAllForOwner({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));
    checkClaimedID(7315, true, 0);
    checkClaimedID(5599, true, 0);

    // Claiming after owner has claimed should fail
    await adventureGoldInstance.claimAllForOwner({ from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));

    // Claiming by a user with no Loot should fail
    await adventureGoldInstance.claimAllForOwner({ from: accounts[9] }).should.eventually.be.rejectedWith("NO_TOKENS_OWNED");
  });

  it('Claim range for owner', async () => {
    // Claiming outside the range should fail
    checkClaimedID(2062, false, 0);
    checkClaimedID(1816, false, 0);
    checkClaimedID(2103, false, 0);
    await adventureGoldInstance.claimRangeForOwner(0, 3, { from: accounts[0] }).should.eventually.be.rejectedWith("INDEX_OUT_OF_RANGE");
    assert.equal(await adventureGoldInstance.balanceOf(accounts[0]), web3.utils.toWei("0"));
    checkClaimedID(2062, false, 0);
    checkClaimedID(1816, false, 0);
    checkClaimedID(2103, false, 0);

    // Claiming range for the owner should succeed
    checkClaimedID(2062, false, 0);
    checkClaimedID(1816, false, 0);
    checkClaimedID(2103, false, 0);
    await adventureGoldInstance.claimRangeForOwner(0, 2, { from: accounts[0] }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf(accounts[0]), web3.utils.toWei("30000"));
    checkClaimedID(2062, true, 0);
    checkClaimedID(1816, true, 0);
    checkClaimedID(2103, true, 0);

    // Claiming after owner has claimed should fail
    await adventureGoldInstance.claimRangeForOwner(0, 2, { from: accounts[0] }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");
    assert.equal(await adventureGoldInstance.balanceOf(accounts[0]), web3.utils.toWei("30000"));

    // Claiming by a user with no Loot should fail
    await adventureGoldInstance.claimRangeForOwner(0, 1, { from: accounts[9] }).should.eventually.be.rejectedWith("NO_TOKENS_OWNED");
  });

  // Add DAO tests
  it('Test DAO functions', async () => {
    // Test DAO mint
    // DAO mint should be accepted when sent by the DAO
    assert.equal(await adventureGoldInstance.balanceOf("0xcD814C83198C15A542F9A13FAf84D518d1744ED1"), web3.utils.toWei("0"));
    await adventureGoldInstance.daoMint(100, { from: "0xcD814C83198C15A542F9A13FAf84D518d1744ED1" }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf("0xcD814C83198C15A542F9A13FAf84D518d1744ED1"), web3.utils.toWei("100"));

    // DAO mint should be rejected when sent by a user who is not the DAO
    await adventureGoldInstance.daoMint(100, { from: accounts[4] }).should.eventually.be.rejectedWith("Ownable: caller is not the owner.");

    // Test setting a new loot contract address
    await adventureGoldInstance.daoSetLootContractAddress("0xcA544Ea3010c105F5f1F25C45AF0759B7bDDd772", { from: "0xcD814C83198C15A542F9A13FAf84D518d1744ED1" }).should.eventually.be.fulfilled;
    await adventureGoldInstance.daoSetLootContractAddress("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", { from: accounts[6] }).should.eventually.be.rejectedWith("Ownable: caller is not the owner.");


    // Test setting an ID range
    await adventureGoldInstance.daoSetTokenIdRange(0, 6, { from: "0xcD814C83198C15A542F9A13FAf84D518d1744ED1" }).should.eventually.be.fulfilled;
    await adventureGoldInstance.daoSetTokenIdRange(1, 42, { from: accounts[6] }).should.eventually.be.rejectedWith("Ownable: caller is not the owner.");

    // Test token index ranges
    checkClaimedID(7, false, 0);
    await adventureGoldInstance.claimById(7, { from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.rejectedWith("TOKEN_ID_OUT_OF_RANGE");
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));
    checkClaimedID(7, false, 0);

    // Test setting a new season
    await adventureGoldInstance.daoSetSeason(1, { from: "0xcD814C83198C15A542F9A13FAf84D518d1744ED1" }).should.eventually.be.fulfilled;
    await adventureGoldInstance.daoSetSeason(1, { from: accounts[6] }).should.eventually.be.rejectedWith("Ownable: caller is not the owner.");

    // Test setting a new claim amount per token 
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));
    await adventureGoldInstance.daoSetAdventureGoldPerTokenId(5, { from: "0xcD814C83198C15A542F9A13FAf84D518d1744ED1" }).should.eventually.be.fulfilled;
    await adventureGoldInstance.daoSetAdventureGoldPerTokenId(5, { from: accounts[6] }).should.eventually.be.rejectedWith("Ownable: caller is not the owner.");

    // Test token index ranges
    checkClaimedID(7, false, 1);
    await adventureGoldInstance.claimById(7, { from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.rejectedWith("TOKEN_ID_OUT_OF_RANGE");
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));

    // Test setting an ID range
    await adventureGoldInstance.daoSetTokenIdRange(0, 7, { from: "0xcD814C83198C15A542F9A13FAf84D518d1744ED1" }).should.eventually.be.fulfilled;
    await adventureGoldInstance.daoSetTokenIdRange(1, 42, { from: accounts[6] }).should.eventually.be.rejectedWith("Ownable: caller is not the owner.");

    // Claim token
    checkClaimedID(7, false, 1);
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200000"));
    await adventureGoldInstance.claimById(7, { from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.fulfilled;
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200005"));
    checkClaimedID(7, true, 1);
    await adventureGoldInstance.claimById(7, { from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");

    // Test setting a new season and a new claim amount per token
    await adventureGoldInstance.daoSetSeasonAndAdventureGoldPerTokenID(2, 10, { from: "0xcD814C83198C15A542F9A13FAf84D518d1744ED1" }).should.eventually.be.fulfilled;
    await adventureGoldInstance.daoSetSeasonAndAdventureGoldPerTokenID(3, 20, { from: accounts[6] }).should.eventually.be.rejectedWith("Ownable: caller is not the owner.");

    // Claim token
    checkClaimedID(7, false, 2);
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200005"));
    await adventureGoldInstance.claimById(7, { from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.fulfilled;
    checkClaimedID(7, true, 2);
    assert.equal(await adventureGoldInstance.balanceOf("0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78"), web3.utils.toWei("200015"));
    await adventureGoldInstance.claimById(7, { from: "0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78" }).should.eventually.be.rejectedWith("GOLD_CLAIMED_FOR_TOKEN_ID");
  });

  async function checkClaimedID(id, value, season) {
    assert.equal(await adventureGoldInstance.seasonClaimedByTokenId(season, id), value);
  }
});
