import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("LeakProof", function () {
  async function deployFixture() {
    const [owner, reporter, reviewerOne, reviewerTwo, outsider] = await ethers.getSigners();

    const accessControl = await ethers.deployContract("LeakProofAccessControl", [owner.address]);
    await accessControl.waitForDeployment();

    await (await accessControl.grantReviewerRole(reviewerOne.address)).wait();
    await (await accessControl.grantReviewerRole(reviewerTwo.address)).wait();

    const core = await ethers.deployContract("LeakProofCore", [await accessControl.getAddress()]);
    await core.waitForDeployment();

    const reviewerHub = await ethers.deployContract("ReviewerHub", [
      await accessControl.getAddress(),
      await core.getAddress(),
    ]);
    await reviewerHub.waitForDeployment();

    const disclosureController = await ethers.deployContract("DisclosureController", [
      await accessControl.getAddress(),
      await core.getAddress(),
    ]);
    await disclosureController.waitForDeployment();

    await (await core.setReviewerHub(await reviewerHub.getAddress())).wait();

    return {
      owner,
      reporter,
      reviewerOne,
      reviewerTwo,
      outsider,
      accessControl,
      core,
      reviewerHub,
      disclosureController,
    };
  }

  async function createCase(core: any, reporter: any) {
    const tx = await core
      .connect(reporter)
      .createCase("bafy-report", ethers.keccak256(ethers.toUtf8Bytes("report")), 0, "bafy-evidence", ethers.ZeroHash);
    await tx.wait();
    return 1n;
  }

  it("creates cases and indexes them by reporter", async function () {
    const { core, reporter } = await loadFixture(deployFixture);

    await createCase(core, reporter);

    const caseIds = await core.getCasesByReporter(reporter.address);
    expect(caseIds).to.deep.equal([1n]);

    const storedCase = await core.getCase(1);
    expect(storedCase[0]).to.equal("bafy-report");
    expect(storedCase[2]).to.equal(0n);
    expect(storedCase[5]).to.equal(reporter.address);
  });

  it("prevents duplicate reviewer assignments and moves the case into review", async function () {
    const { core, reviewerHub, reporter, reviewerOne } = await loadFixture(deployFixture);

    await createCase(core, reporter);

    await (await reviewerHub.assignReviewer(1, reviewerOne.address)).wait();
    await expect(reviewerHub.assignReviewer(1, reviewerOne.address)).to.be.revertedWith("Already assigned");

    const reviewers = await core.getCaseReviewers(1);
    expect(reviewers).to.deep.equal([reviewerOne.address]);
    expect(await core.getCaseStatus(1)).to.equal(1n);
  });

  it("reject votes no longer count as approvals", async function () {
    const { core, reviewerHub, reporter, reviewerOne, reviewerTwo } = await loadFixture(deployFixture);

    await createCase(core, reporter);
    await (await reviewerHub.assignReviewer(1, reviewerOne.address)).wait();
    await (await reviewerHub.assignReviewer(1, reviewerTwo.address)).wait();

    await (await reviewerHub.connect(reviewerOne).submitVote(1, 2, 3, "enc-notes-1")).wait();
    expect(await core.getCaseStatus(1)).to.equal(1n);

    await (await reviewerHub.connect(reviewerTwo).submitVote(1, 2, 4, "enc-notes-2")).wait();

    expect(await core.getCaseStatus(1)).to.equal(6n);

    const caseData = await core.getCase(1);
    expect(caseData[12]).to.equal(2n);
    expect(caseData[11]).to.equal(0n);
  });

  it("approve votes reach verification only when threshold is met", async function () {
    const { core, reviewerHub, reporter, reviewerOne, reviewerTwo } = await loadFixture(deployFixture);

    await createCase(core, reporter);
    await (await reviewerHub.assignReviewer(1, reviewerOne.address)).wait();
    await (await reviewerHub.assignReviewer(1, reviewerTwo.address)).wait();

    await (await reviewerHub.connect(reviewerOne).submitVote(1, 1, 5, "enc-a")).wait();
    expect(await core.getCaseStatus(1)).to.equal(1n);

    await (await reviewerHub.connect(reviewerTwo).submitVote(1, 1, 4, "enc-b")).wait();

    expect(await core.getCaseStatus(1)).to.equal(4n);

    const summary = await reviewerHub.getVoteSummary(1);
    expect(summary[0]).to.equal(2n);
    expect(summary[3]).to.equal(2n);
  });

  it("allows escalations and reporter closure after resolution", async function () {
    const { core, reviewerHub, reporter, reviewerOne } = await loadFixture(deployFixture);

    await createCase(core, reporter);
    await (await reviewerHub.assignReviewer(1, reviewerOne.address)).wait();
    await (await reviewerHub.connect(reviewerOne).submitVote(1, 3, 5, "enc-escalate")).wait();

    expect(await core.getCaseStatus(1)).to.equal(3n);

    await (await core.connect(reporter).updateStatus(1, 5)).wait();
    expect(await core.getCaseStatus(1)).to.equal(5n);
  });

  it("stores and resolves disclosure requests", async function () {
    const { core, disclosureController, reporter, outsider } = await loadFixture(deployFixture);

    await createCase(core, reporter);

    await (await disclosureController.connect(outsider).requestDisclosure(1, 2)).wait();

    const requestsBefore = await disclosureController.getDisclosureRequests(1);
    expect(requestsBefore.length).to.equal(1);
    expect(requestsBefore[0].requester).to.equal(outsider.address);
    expect(requestsBefore[0].resolved).to.equal(false);

    await (await disclosureController.resolveDisclosureRequest(1, 0, true)).wait();

    const [canAccess, level] = await disclosureController.canAccessCase(outsider.address, 1);
    expect(canAccess).to.equal(true);
    expect(level).to.equal(2n);
  });
});
