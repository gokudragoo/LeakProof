import { ethers } from "ethers";

async function main() {
  // Connect to Sepolia via Infura/Alchemy public RPC
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");

  // Create wallet from private key
  const privateKey = "0x1b59287d686da03c68c12fcc49147597d33725524b15958879c4f76f45f84178";
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying with account:", wallet.address);
  console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)));

  // Deploy AccessControl first
  console.log("\nDeploying AccessControl...");
  const AccessControlFactory = await ethers.getContractFactory("AccessControl", wallet);
  const accessControl = await AccessControlFactory.deploy(wallet.address);
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControl deployed to:", accessControlAddress);

  // Deploy LeakProofCore
  console.log("\nDeploying LeakProofCore...");
  const LeakProofCoreFactory = await ethers.getContractFactory("LeakProofCore", wallet);
  const core = await LeakProofCoreFactory.deploy(accessControlAddress);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("LeakProofCore deployed to:", coreAddress);

  // Deploy ReviewerHub
  console.log("\nDeploying ReviewerHub...");
  const ReviewerHubFactory = await ethers.getContractFactory("ReviewerHub", wallet);
  const reviewerHub = await ReviewerHubFactory.deploy(accessControlAddress, coreAddress);
  await reviewerHub.waitForDeployment();
  const reviewerHubAddress = await reviewerHub.getAddress();
  console.log("ReviewerHub deployed to:", reviewerHubAddress);

  // Deploy DisclosureController
  console.log("\nDeploying DisclosureController...");
  const DisclosureControllerFactory = await ethers.getContractFactory("DisclosureController", wallet);
  const disclosureCtrl = await DisclosureControllerFactory.deploy(accessControlAddress, coreAddress);
  await disclosureCtrl.waitForDeployment();
  const disclosureCtrlAddress = await disclosureCtrl.getAddress();
  console.log("DisclosureController deployed to:", disclosureCtrlAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("AccessControl:", accessControlAddress);
  console.log("LeakProofCore:", coreAddress);
  console.log("ReviewerHub:", reviewerHubAddress);
  console.log("DisclosureController:", disclosureCtrlAddress);

  // Save to env files
  const fs = require('fs');
  const envContent = `
# Contract Addresses (deployed on Sepolia)
NEXT_PUBLIC_ACCESS_CONTROL=${accessControlAddress}
NEXT_PUBLIC_CORE=${coreAddress}
NEXT_PUBLIC_REVIEWER_HUB=${reviewerHubAddress}
NEXT_PUBLIC_DISCLOSURE_CTRL=${disclosureCtrlAddress}
`;

  fs.writeFileSync("../.env.local", envContent);
  fs.writeFileSync("./.env.deployed", envContent);

  console.log("\nAddresses saved to .env.local and .env.deployed");
  console.log("\nDeployment complete!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});