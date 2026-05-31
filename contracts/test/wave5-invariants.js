const assert = require("node:assert/strict");
const { ethers, network } = require("hardhat");

const DAY = 24 * 60 * 60;

async function increaseTime(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

async function deployGovernance() {
  const [owner, other] = await ethers.getSigners();

  const AccessControl = await ethers.getContractFactory("LeakProofAccessControl");
  const accessControl = await AccessControl.deploy(owner.address);
  await accessControl.waitForDeployment();

  const Token = await ethers.getContractFactory("LeakProofToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const DAO = await ethers.getContractFactory("LeakProofDAO");
  const dao = await DAO.deploy(await token.getAddress(), await accessControl.getAddress());
  await dao.waitForDeployment();

  return { owner, other, accessControl, token, dao };
}

async function createThresholdProposal(dao, threshold = 3) {
  const calldata = dao.interface.encodeFunctionData("setCaseApprovalThreshold", [threshold]);
  await dao.propose([await dao.getAddress()], [0n], [calldata], `Set approval threshold to ${threshold}`);
  return 0;
}

describe("Wave 5 production invariants", function () {
  this.timeout(120_000);

  it("uses proposal snapshot votes so transferred tokens cannot vote twice", async function () {
    const { owner, other, token, dao } = await deployGovernance();
    const proposalId = await createThresholdProposal(dao);

    const ownerBalance = await token.balanceOf(owner.address);
    await token.transfer(other.address, ownerBalance);
    await token.connect(other).delegate(other.address);

    await increaseTime(DAY + 1);

    await dao.castVote(proposalId, 1);
    await assert.rejects(
      dao.connect(other).castVote(proposalId, 1),
      /No voting power/
    );
  });

  it("lets any caller execute a succeeded stored-action proposal", async function () {
    const { other, dao } = await deployGovernance();
    const proposalId = await createThresholdProposal(dao, 4);

    await increaseTime(DAY + 1);
    await dao.castVote(proposalId, 1);
    await increaseTime(7 * DAY + 1);

    await dao.connect(other).executeProposal(proposalId);
    assert.equal(await dao.caseApprovalThreshold(), 4n);
  });

  it("rotates default admin custody atomically", async function () {
    const [owner, multisig] = await ethers.getSigners();
    const AccessControl = await ethers.getContractFactory("LeakProofAccessControl");
    const accessControl = await AccessControl.deploy(owner.address);
    await accessControl.waitForDeployment();

    await accessControl.rotateDefaultAdmin(multisig.address, owner.address);

    assert.equal(await accessControl.isAdmin(owner.address), false);
    assert.equal(await accessControl.isAdmin(multisig.address), true);
  });

  it("does not mark missing emergency overrides executable", async function () {
    const [owner] = await ethers.getSigners();
    const AccessControl = await ethers.getContractFactory("LeakProofAccessControl");
    const accessControl = await AccessControl.deploy(owner.address);
    await accessControl.waitForDeployment();

    const Core = await ethers.getContractFactory("LeakProofCore");
    const core = await Core.deploy(await accessControl.getAddress());
    await core.waitForDeployment();

    const DisclosureController = await ethers.getContractFactory("DisclosureController");
    const disclosure = await DisclosureController.deploy(await accessControl.getAddress(), await core.getAddress());
    await disclosure.waitForDeployment();

    const TimeLockedDisclosure = await ethers.getContractFactory("TimeLockedDisclosure");
    const timeLocked = await TimeLockedDisclosure.deploy(
      await accessControl.getAddress(),
      await core.getAddress(),
      await disclosure.getAddress()
    );
    await timeLocked.waitForDeployment();

    const overrideInfo = await timeLocked.getEmergencyOverrideInfo(1);
    assert.equal(overrideInfo[5], false);
  });
});
