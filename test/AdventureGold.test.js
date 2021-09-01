const { BN, ether } = require("@openzeppelin/test-helpers");
const { assertion } = require("@openzeppelin/test-helpers/src/expectRevert");
const { expect } = require("chai");
require("chai").use(require("chai-as-promised")).should();

const AdventureGold = artifacts.require("AdventureGold");
const LootABI = require("./abi/Loot").abi;
const lootContract = new web3.eth.Contract(LootABI, "0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7");

contract('AdventureGold', (accounts) => {
  it('Contract names should be correct', async () => {
    const adventureGoldInstance = await AdventureGold.deployed();

    assert.equal(await adventureGoldInstance.name(), 'Adventure Gold');
    assert.equal(await lootContract.methods.name().call(), 'Loot');
  });
});