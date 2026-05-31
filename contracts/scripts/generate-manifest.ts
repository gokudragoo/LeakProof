import fs from "fs";
import path from "path";
import crypto from "crypto";

const contractsDir = path.resolve(__dirname, "..");
const repoDir = path.resolve(contractsDir, "..");
const deployedEnvPath = path.join(contractsDir, ".env.deployed");
const outputDir = path.join(repoDir, "deployments");
const outputPath = path.join(outputDir, "sepolia.manifest.json");

const contractFiles = [
  "AccessControl.sol",
  "LeakProofCore.sol",
  "ReviewerHub.sol",
  "DisclosureController.sol",
  "LeakProofToken.sol",
  "ReputationRegistry.sol",
  "TimeLockedDisclosure.sol",
  "DAOGovernance.sol",
];

const buildInputFiles = [
  path.join(repoDir, "package.json"),
  path.join(repoDir, "package-lock.json"),
  path.join(contractsDir, "package.json"),
  path.join(contractsDir, "hardhat.config.ts"),
  path.join(contractsDir, "scripts", "deploy.ts"),
  path.join(contractsDir, "scripts", "check-deployment.ts"),
  path.join(contractsDir, "scripts", "generate-manifest.ts"),
];

function readEnv(filePath: string) {
  const entries: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (!line || line.trim().startsWith("#") || separator === -1) {
      continue;
    }
    entries[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return entries;
}

function sha256(value: string | Buffer) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

const deployed = readEnv(deployedEnvPath);
const sources = contractFiles.map((fileName) => {
  const sourcePath = path.join(contractsDir, "contracts", fileName);
  return {
    fileName,
    sha256: sha256(fs.readFileSync(sourcePath)),
  };
});

const buildInputs = buildInputFiles
  .filter((filePath) => fs.existsSync(filePath))
  .map((filePath) => ({
    fileName: path.relative(repoDir, filePath).replace(/\\/g, "/"),
    sha256: sha256(fs.readFileSync(filePath)),
  }));

const manifest = {
  schema: "leakproof-deployment-manifest/v1",
  generatedAt: new Date().toISOString(),
  chain: {
    name: "Ethereum Sepolia",
    chainId: 11155111,
  },
  contracts: {
    accessControl: deployed.NEXT_PUBLIC_ACCESS_CONTROL,
    core: deployed.NEXT_PUBLIC_CORE,
    reviewerHub: deployed.NEXT_PUBLIC_REVIEWER_HUB,
    disclosureController: deployed.NEXT_PUBLIC_DISCLOSURE_CTRL,
    token: deployed.NEXT_PUBLIC_TOKEN,
    reputationRegistry: deployed.NEXT_PUBLIC_REPUTATION,
    timeLockedDisclosure: deployed.NEXT_PUBLIC_TIMELOCKED,
    dao: deployed.NEXT_PUBLIC_DAO,
  },
  compiler: {
    solidity: "0.8.28",
    optimizerRuns: 200,
    evmVersion: "cancun",
    viaIR: true,
  },
  sourceDigest: sha256(JSON.stringify({ sources, buildInputs })),
  sources,
  buildInputs,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Deployment manifest written to ${outputPath}`);
