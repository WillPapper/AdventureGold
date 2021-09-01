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
    const adventureGoldInstance = await AdventureGold.deployed();

    assert.equal(await lootContract.methods.balanceOf('0xdd3767ABcAB26f261e2508A1DA1914053c7DDa78').call(), new BN('24'));
  });
});