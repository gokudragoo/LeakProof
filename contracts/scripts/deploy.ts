import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy AccessControl first
  console.log("\nDeploying LeakProofAccessControl...");
  const AccessControl = await ethers.getContractFactory("LeakProofAccessControl");
  const accessControl = await AccessControl.deploy(deployer.address);
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControl deployed to:", accessControlAddress);

  // Deploy LeakProofCore
  console.log("\nDeploying LeakProofCore...");
  const LeakProofCore = await ethers.getContractFactory("LeakProofCore");
  const core = await LeakProofCore.deploy(accessControlAddress);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("LeakProofCore deployed to:", coreAddress);

  // Deploy ReviewerHub
  console.log("\nDeploying ReviewerHub...");
  const ReviewerHub = await ethers.getContractFactory("ReviewerHub");
  const reviewerHub = await ReviewerHub.deploy(accessControlAddress, coreAddress);
  await reviewerHub.waitForDeployment();
  const reviewerHubAddress = await reviewerHub.getAddress();
  console.log("ReviewerHub deployed to:", reviewerHubAddress);

  // Deploy DisclosureController
  console.log("\nDeploying DisclosureController...");
  const DisclosureController = await ethers.getContractFactory("DisclosureController");
  const disclosureCtrl = await DisclosureController.deploy(accessControlAddress, coreAddress);
  await disclosureCtrl.waitForDeployment();
  const disclosureCtrlAddress = await disclosureCtrl.getAddress();
  console.log("DisclosureController deployed to:", disclosureCtrlAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("AccessControl:", accessControlAddress);
  console.log("LeakProofCore:", coreAddress);
  console.log("ReviewerHub:", reviewerHubAddress);
  console.log("DisclosureController:", disclosureCtrlAddress);

  console.log("\nUpdating .env.local with deployed addresses...");

  const fs = require("fs");
  const envPath = "../.env.local";
  let envContent = "";
  try {
    envContent = fs.readFileSync(envPath, "utf8");
  } catch (e) {
    envContent = "";
  }

  const newEnv = `
# Deployed Contract Addresses
NEXT_PUBLIC_ACCESS_CONTROL=${accessControlAddress}
NEXT_PUBLIC_CORE=${coreAddress}
NEXT_PUBLIC_REVIEWER_HUB=${reviewerHubAddress}
NEXT_PUBLIC_DISCLOSURE_CTRL=${disclosureCtrlAddress}
`;

  fs.writeFileSync(envPath, envContent + newEnv);
  console.log("Updated .env.local");

  console.log("\nDeployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});