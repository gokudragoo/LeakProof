import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

function upsertEnvValue(source: string, key: string, value: string) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(source)) {
    return source.replace(pattern, `${key}=${value}`);
  }

  const normalized = source.trimEnd();
  return `${normalized}${normalized ? "\n" : ""}${key}=${value}\n`;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`Deploying with ${deployerAddress}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  const accessControl = await ethers.deployContract("LeakProofAccessControl", [deployerAddress]);
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();

  const core = await ethers.deployContract("LeakProofCore", [accessControlAddress]);
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();

  const reviewerHub = await ethers.deployContract("ReviewerHub", [accessControlAddress, coreAddress]);
  await reviewerHub.waitForDeployment();
  const reviewerHubAddress = await reviewerHub.getAddress();

  const disclosureController = await ethers.deployContract("DisclosureController", [
    accessControlAddress,
    coreAddress,
  ]);
  await disclosureController.waitForDeployment();
  const disclosureControllerAddress = await disclosureController.getAddress();

  await (await core.setReviewerHub(reviewerHubAddress)).wait();

  const frontendEnvPath = path.resolve(__dirname, "../../frontend/.env.local");
  const currentFrontendEnv = fs.existsSync(frontendEnvPath)
    ? fs.readFileSync(frontendEnvPath, "utf8")
    : "";

  let nextFrontendEnv = currentFrontendEnv;
  nextFrontendEnv = upsertEnvValue(nextFrontendEnv, "NEXT_PUBLIC_ACCESS_CONTROL", accessControlAddress);
  nextFrontendEnv = upsertEnvValue(nextFrontendEnv, "NEXT_PUBLIC_CORE", coreAddress);
  nextFrontendEnv = upsertEnvValue(nextFrontendEnv, "NEXT_PUBLIC_REVIEWER_HUB", reviewerHubAddress);
  nextFrontendEnv = upsertEnvValue(
    nextFrontendEnv,
    "NEXT_PUBLIC_DISCLOSURE_CTRL",
    disclosureControllerAddress
  );

  fs.writeFileSync(frontendEnvPath, nextFrontendEnv);

  const deployedEnvPath = path.resolve(__dirname, "../.env.deployed");
  fs.writeFileSync(
    deployedEnvPath,
    [
      `NEXT_PUBLIC_ACCESS_CONTROL=${accessControlAddress}`,
      `NEXT_PUBLIC_CORE=${coreAddress}`,
      `NEXT_PUBLIC_REVIEWER_HUB=${reviewerHubAddress}`,
      `NEXT_PUBLIC_DISCLOSURE_CTRL=${disclosureControllerAddress}`,
    ].join("\n") + "\n"
  );

  console.log("Deployment summary");
  console.log(`  AccessControl:  ${accessControlAddress}`);
  console.log(`  LeakProofCore:  ${coreAddress}`);
  console.log(`  ReviewerHub:    ${reviewerHubAddress}`);
  console.log(`  DisclosureCtrl: ${disclosureControllerAddress}`);
  console.log(`  Frontend env:   ${frontendEnvPath}`);
  console.log(`  Deploy record:  ${deployedEnvPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
