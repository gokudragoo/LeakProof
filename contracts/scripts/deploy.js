const { ethers, ContractFactory } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URL = "https://ethereum-sepolia.publicnode.com";

async function deploy() {
  console.log("Connecting to Sepolia via publicnode...");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet("0x1b59287d686da03c68c12fcc49147597d33725524b15958879c4f76f45f84178", provider);

  console.log("Deployer address:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.log("WARNING: Account has 0 ETH! Get some Sepolia ETH from a faucet.");
  }

  const contractsDir = path.join(__dirname, "../artifacts/contracts");

  // Deploy AccessControl
  console.log("[1/4] Deploying AccessControl...");
  const accessControlArtifact = JSON.parse(fs.readFileSync(path.join(contractsDir, "AccessControl.sol/AccessControl.json"), "utf8"));
  const AccessControlFactory = new ContractFactory(accessControlArtifact.abi, accessControlArtifact.bytecode, wallet);
  const accessControl = await AccessControlFactory.deploy(wallet.address);
  const accessControlReceipt = await accessControl.deploymentTransaction().wait();
  const accessControlAddress = await accessControl.getAddress();
  console.log("  Deployed:", accessControlAddress);
  console.log("  Gas used:", accessControlReceipt?.gasUsed?.toString());

  // Deploy LeakProofCore
  console.log("\n[2/4] Deploying LeakProofCore...");
  const coreArtifact = JSON.parse(fs.readFileSync(path.join(contractsDir, "LeakProofCore.sol/LeakProofCore.json"), "utf8"));
  const CoreFactory = new ContractFactory(coreArtifact.abi, coreArtifact.bytecode, wallet);
  const core = await CoreFactory.deploy(accessControlAddress);
  const coreReceipt = await core.deploymentTransaction().wait();
  const coreAddress = await core.getAddress();
  console.log("  Deployed:", coreAddress);
  console.log("  Gas used:", coreReceipt?.gasUsed?.toString());

  // Deploy ReviewerHub
  console.log("\n[3/4] Deploying ReviewerHub...");
  const reviewerArtifact = JSON.parse(fs.readFileSync(path.join(contractsDir, "ReviewerHub.sol/ReviewerHub.json"), "utf8"));
  const ReviewerFactory = new ContractFactory(reviewerArtifact.abi, reviewerArtifact.bytecode, wallet);
  const reviewerHub = await ReviewerFactory.deploy(accessControlAddress, coreAddress);
  const reviewerReceipt = await reviewerHub.deploymentTransaction().wait();
  const reviewerHubAddress = await reviewerHub.getAddress();
  console.log("  Deployed:", reviewerHubAddress);
  console.log("  Gas used:", reviewerReceipt?.gasUsed?.toString());

  // Deploy DisclosureController
  console.log("\n[4/4] Deploying DisclosureController...");
  const disclosureArtifact = JSON.parse(fs.readFileSync(path.join(contractsDir, "DisclosureController.sol/DisclosureController.json"), "utf8"));
  const DisclosureFactory = new ContractFactory(disclosureArtifact.abi, disclosureArtifact.bytecode, wallet);
  const disclosureCtrl = await DisclosureFactory.deploy(accessControlAddress, coreAddress);
  const disclosureReceipt = await disclosureCtrl.deploymentTransaction().wait();
  const disclosureCtrlAddress = await disclosureCtrl.getAddress();
  console.log("  Deployed:", disclosureCtrlAddress);
  console.log("  Gas used:", disclosureReceipt?.gasUsed?.toString());

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("AccessControl:     ", accessControlAddress);
  console.log("LeakProofCore:     ", coreAddress);
  console.log("ReviewerHub:        ", reviewerHubAddress);
  console.log("DisclosureCtrl:     ", disclosureCtrlAddress);
  console.log("=".repeat(60));

  const envContent = `NEXT_PUBLIC_ACCESS_CONTROL=${accessControlAddress}
NEXT_PUBLIC_CORE=${coreAddress}
NEXT_PUBLIC_REVIEWER_HUB=${reviewerHubAddress}
NEXT_PUBLIC_DISCLOSURE_CTRL=${disclosureCtrlAddress}
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=demo-project-id`;

  fs.writeFileSync("../.env.local", envContent);
  console.log("\nAddresses saved to ../.env.local");

  // Verify
  const isAdmin = await accessControl.isAdmin(wallet.address);
  console.log("\nVerification - isAdmin:", isAdmin);
}

deploy().catch(err => {
  console.error("\nDeployment failed:", err.message || err);
  process.exit(1);
});