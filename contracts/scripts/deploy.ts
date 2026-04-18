import { ethers, ContractFactory } from "ethers";
import fs from "fs";
import path from "path";

const RPC_ENDPOINTS = [
  "https://rpc.ankr.com/eth_sepolia",
  "https://eth-sepolia.g.alchemy.com/v2/demo",
  "https://rpc.sepolia.org",
  "https://rpc2.sepolia.org",
  "https://rpc.sepolia.discover.quantstamp.com",
];

async function main() {
  let provider: ethers.JsonRpcProvider | null = null;

  // Try each RPC endpoint
  for (const rpc of RPC_ENDPOINTS) {
    try {
      console.log(`Trying RPC: ${rpc}`);
      provider = new ethers.JsonRpcProvider(rpc);
      await provider.getBlockNumber(); // Test connection
      console.log(`Connected to ${rpc}`);
      break;
    } catch (e: any) {
      console.log(`Failed: ${e.message?.slice(0, 50)}...`);
      provider = null;
    }
  }

  if (!provider) {
    console.log("ERROR: Could not connect to any RPC endpoint");
    return;
  }

  const privateKey = "0x1b59287d686da03c68c12fcc49147597d33725524b15958879c4f76f45f84178";
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("\nDeploying with account:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("WARNING: Account has 0 balance. Deployment will still be attempted.");
  }

  const contractsDir = path.join(__dirname, "../artifacts/contracts");

  // Deploy AccessControl
  console.log("\n[1/4] Deploying AccessControl...");
  const accessControlArtifact = JSON.parse(
    fs.readFileSync(path.join(contractsDir, "AccessControl.sol/AccessControl.json"), "utf8")
  );
  const AccessControlFactory = new ContractFactory(
    accessControlArtifact.abi,
    accessControlArtifact.bytecode,
    wallet
  );
  const accessControl = await AccessControlFactory.deploy(wallet.address);
  const accessControlReceipt = await accessControl.deploymentTransaction().wait();
  const accessControlAddress = await accessControl.getAddress();
  console.log("  Deployed to:", accessControlAddress);
  console.log("  Gas used:", accessControlReceipt?.gasUsed?.toString());

  // Deploy LeakProofCore
  console.log("\n[2/4] Deploying LeakProofCore...");
  const coreArtifact = JSON.parse(
    fs.readFileSync(path.join(contractsDir, "LeakProofCore.sol/LeakProofCore.json"), "utf8")
  );
  const CoreFactory = new ContractFactory(
    coreArtifact.abi,
    coreArtifact.bytecode,
    wallet
  );
  const core = await CoreFactory.deploy(accessControlAddress);
  const coreReceipt = await core.deploymentTransaction().wait();
  const coreAddress = await core.getAddress();
  console.log("  Deployed to:", coreAddress);
  console.log("  Gas used:", coreReceipt?.gasUsed?.toString());

  // Deploy ReviewerHub
  console.log("\n[3/4] Deploying ReviewerHub...");
  const reviewerArtifact = JSON.parse(
    fs.readFileSync(path.join(contractsDir, "ReviewerHub.sol/ReviewerHub.json"), "utf8")
  );
  const ReviewerFactory = new ContractFactory(
    reviewerArtifact.abi,
    reviewerArtifact.bytecode,
    wallet
  );
  const reviewerHub = await ReviewerFactory.deploy(accessControlAddress, coreAddress);
  const reviewerReceipt = await reviewerHub.deploymentTransaction().wait();
  const reviewerHubAddress = await reviewerHub.getAddress();
  console.log("  Deployed to:", reviewerHubAddress);
  console.log("  Gas used:", reviewerReceipt?.gasUsed?.toString());

  // Deploy DisclosureController
  console.log("\n[4/4] Deploying DisclosureController...");
  const disclosureArtifact = JSON.parse(
    fs.readFileSync(path.join(contractsDir, "DisclosureController.sol/DisclosureController.json"), "utf8")
  );
  const DisclosureFactory = new ContractFactory(
    disclosureArtifact.abi,
    disclosureArtifact.bytecode,
    wallet
  );
  const disclosureCtrl = await DisclosureFactory.deploy(accessControlAddress, coreAddress);
  const disclosureReceipt = await disclosureCtrl.deploymentTransaction().wait();
  const disclosureCtrlAddress = await disclosureCtrl.getAddress();
  console.log("  Deployed to:", disclosureCtrlAddress);
  console.log("  Gas used:", disclosureReceipt?.gasUsed?.toString());

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("AccessControl:     ", accessControlAddress);
  console.log("LeakProofCore:     ", coreAddress);
  console.log("ReviewerHub:       ", reviewerHubAddress);
  console.log("DisclosureCtrl:    ", disclosureCtrlAddress);
  console.log("=".repeat(60));

  // Save to files
  const envContent = `# Deployed on Sepolia - ${new Date().toISOString()}
NEXT_PUBLIC_ACCESS_CONTROL=${accessControlAddress}
NEXT_PUBLIC_CORE=${coreAddress}
NEXT_PUBLIC_REVIEWER_HUB=${reviewerHubAddress}
NEXT_PUBLIC_DISCLOSURE_CTRL=${disclosureCtrlAddress}
`;

  fs.writeFileSync("../.env.local", envContent);
  fs.writeFileSync("./.env.deployed", envContent);

  console.log("\nAddresses saved to .env.local and .env.deployed");

  // Verify deployment
  console.log("\nVerifying contracts...");
  const isAdmin = await accessControl.isAdmin(wallet.address);
  console.log("AccessControl verified - isAdmin:", isAdmin);

  console.log("\n Deployment complete!");
}

main().catch((error) => {
  console.error("\nDeployment failed:", error.message || error);
  process.exit(1);
});