const { BN, ether } = require("@openzeppelin/test-helpers");
const { assertion } = require("@openzeppelin/test-helpers/src/expectRevert");
const { expect } = require("chai");
require("chai").use(require("chai-as-promised")).should();

const AdventureGold = artifacts.require("AdventureGold");
const Loot = require("./abi/Loot");

contract('AdventureGold', (accounts) => {
  it('Contract names should be correct', async () => {
    const adventureGoldInstance = await AdventureGold.deployed();

    assert.equal(await adventureGoldInstance.name(), 'Adventure Gold');
  });
});