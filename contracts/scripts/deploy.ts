import { ethers, ContractFactory } from "ethers";
import fs from "fs";
import path from "path";

// Simple deployer that doesn't need hardhat's getContractFactory
async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
  const privateKey = "0x1b59287d686da03c68c12fcc49147597d33725524b15958879c4f76f45f84178";
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying with account:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("ERROR: Account has 0 balance. Please fund the account first!");
    return;
  }

  // ABI and bytecode will be loaded from compiled artifacts
  const contractsDir = path.join(__dirname, "../artifacts/contracts");

  // Deploy AccessControl
  console.log("\nDeploying AccessControl...");
  const accessControlArtifact = JSON.parse(
    fs.readFileSync(path.join(contractsDir, "AccessControl.sol/AccessControl.json"), "utf8")
  );
  const AccessControlFactory = new ContractFactory(
    accessControlArtifact.abi,
    accessControlArtifact.bytecode,
    wallet
  );
  const accessControl = await AccessControlFactory.deploy(wallet.address);
  await accessControl.deploymentTransaction().wait();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControl deployed to:", accessControlAddress);

  // Deploy LeakProofCore
  console.log("\nDeploying LeakProofCore...");
  const coreArtifact = JSON.parse(
    fs.readFileSync(path.join(contractsDir, "LeakProofCore.sol/LeakProofCore.json"), "utf8")
  );
  const CoreFactory = new ContractFactory(
    coreArtifact.abi,
    coreArtifact.bytecode,
    wallet
  );
  const core = await CoreFactory.deploy(accessControlAddress);
  await core.deploymentTransaction().wait();
  const coreAddress = await core.getAddress();
  console.log("LeakProofCore deployed to:", coreAddress);

  // Deploy ReviewerHub
  console.log("\nDeploying ReviewerHub...");
  const reviewerArtifact = JSON.parse(
    fs.readFileSync(path.join(contractsDir, "ReviewerHub.sol/ReviewerHub.json"), "utf8")
  );
  const ReviewerFactory = new ContractFactory(
    reviewerArtifact.abi,
    reviewerArtifact.bytecode,
    wallet
  );
  const reviewerHub = await ReviewerFactory.deploy(accessControlAddress, coreAddress);
  await reviewerHub.deploymentTransaction().wait();
  const reviewerHubAddress = await reviewerHub.getAddress();
  console.log("ReviewerHub deployed to:", reviewerHubAddress);

  // Deploy DisclosureController
  console.log("\nDeploying DisclosureController...");
  const disclosureArtifact = JSON.parse(
    fs.readFileSync(path.join(contractsDir, "DisclosureController.sol/DisclosureController.json"), "utf8")
  );
  const DisclosureFactory = new ContractFactory(
    disclosureArtifact.abi,
    disclosureArtifact.bytecode,
    wallet
  );
  const disclosureCtrl = await DisclosureFactory.deploy(accessControlAddress, coreAddress);
  await disclosureCtrl.deploymentTransaction().wait();
  const disclosureCtrlAddress = await disclosureCtrl.getAddress();
  console.log("DisclosureController deployed to:", disclosureCtrlAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("AccessControl:", accessControlAddress);
  console.log("LeakProofCore:", coreAddress);
  console.log("ReviewerHub:", reviewerHubAddress);
  console.log("DisclosureController:", disclosureCtrlAddress);

  // Save addresses
  const envContent = `
# Contract Addresses (deployed on Sepolia)
NEXT_PUBLIC_ACCESS_CONTROL=${accessControlAddress}
NEXT_PUBLIC_CORE=${coreAddress}
NEXT_PUBLIC_REVIEWER_HUB=${reviewerHubAddress}
NEXT_PUBLIC_DISCLOSURE_CTRL=${disclosureCtrlAddress}
`;

  fs.writeFileSync("../.env.local", envContent);
  fs.writeFileSync("./.env.deployed", envContent);

  console.log("\nAddresses saved!");
  console.log("\nDeployment complete!");
}

main().catch((error) => {
  console.error("Deployment failed:", error.message || error);
  process.exit(1);
});