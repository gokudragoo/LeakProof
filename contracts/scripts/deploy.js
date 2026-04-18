const axios = require('axios');

const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/demo";

async function checkBalance() {
  try {
    const response = await axios.post(RPC_URL, {
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1
    });
    console.log("Block number:", response.data.result);
    return true;
  } catch (error) {
    console.log("Error:", error.message);
    return false;
  }
}

async function deploy() {
  // First check connection
  const connected = await checkBalance();
  if (!connected) {
    console.log("Cannot connect to RPC");
    return;
  }

  const { ethers, ContractFactory } = require("ethers");
  const fs = require("fs");
  const path = require("path");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet("0x1b59287d686da03c68c12fcc49147597d33725524b15958879c4f76f45f84178", provider);

  console.log("Deploying with:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  const contractsDir = path.join(__dirname, "../artifacts/contracts");

  console.log("\nDeploying AccessControl...");
  const accessControlArtifact = JSON.parse(fs.readFileSync(path.join(contractsDir, "AccessControl.sol/AccessControl.json"), "utf8"));
  const AccessControlFactory = new ContractFactory(accessControlArtifact.abi, accessControlArtifact.bytecode, wallet);
  const accessControl = await AccessControlFactory.deploy(wallet.address);
  await accessControl.deploymentTransaction().wait();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControl:", accessControlAddress);

  console.log("\nDeploying LeakProofCore...");
  const coreArtifact = JSON.parse(fs.readFileSync(path.join(contractsDir, "LeakProofCore.sol/LeakProofCore.json"), "utf8"));
  const CoreFactory = new ContractFactory(coreArtifact.abi, coreArtifact.bytecode, wallet);
  const core = await CoreFactory.deploy(accessControlAddress);
  await core.deploymentTransaction().wait();
  const coreAddress = await core.getAddress();
  console.log("LeakProofCore:", coreAddress);

  console.log("\nDeploying ReviewerHub...");
  const reviewerArtifact = JSON.parse(fs.readFileSync(path.join(contractsDir, "ReviewerHub.sol/ReviewerHub.json"), "utf8"));
  const ReviewerFactory = new ContractFactory(reviewerArtifact.abi, reviewerArtifact.bytecode, wallet);
  const reviewerHub = await ReviewerFactory.deploy(accessControlAddress, coreAddress);
  await reviewerHub.deploymentTransaction().wait();
  const reviewerHubAddress = await reviewerHub.getAddress();
  console.log("ReviewerHub:", reviewerHubAddress);

  console.log("\nDeploying DisclosureController...");
  const disclosureArtifact = JSON.parse(fs.readFileSync(path.join(contractsDir, "DisclosureController.sol/DisclosureController.json"), "utf8"));
  const DisclosureFactory = new ContractFactory(disclosureArtifact.abi, disclosureArtifact.bytecode, wallet);
  const disclosureCtrl = await DisclosureFactory.deploy(accessControlAddress, coreAddress);
  await disclosureCtrl.deploymentTransaction().wait();
  const disclosureCtrlAddress = await disclosureCtrl.getAddress();
  console.log("DisclosureController:", disclosureCtrlAddress);

  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));

  const envContent = `NEXT_PUBLIC_ACCESS_CONTROL=${accessControlAddress}
NEXT_PUBLIC_CORE=${coreAddress}
NEXT_PUBLIC_REVIEWER_HUB=${reviewerHubAddress}
NEXT_PUBLIC_DISCLOSURE_CTRL=${disclosureCtrlAddress}
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=demo-project-id`;

  fs.writeFileSync("../.env.local", envContent);
  console.log("\nAddresses saved to .env.local");
}

deploy().catch(console.error);