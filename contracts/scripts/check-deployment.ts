import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

const contractsDir = path.resolve(__dirname, "..");
const repoDir = path.resolve(contractsDir, "..");
dotenv.config({ path: path.join(repoDir, ".env") });

const required = [
  ["AccessControl", "NEXT_PUBLIC_ACCESS_CONTROL"],
  ["LeakProofCore", "NEXT_PUBLIC_CORE"],
  ["ReviewerHub", "NEXT_PUBLIC_REVIEWER_HUB"],
  ["DisclosureCtrl", "NEXT_PUBLIC_DISCLOSURE_CTRL"],
  ["LeakProofToken", "NEXT_PUBLIC_TOKEN"],
  ["ReputationRegistry", "NEXT_PUBLIC_REPUTATION"],
  ["TimeLockedDisclosure", "NEXT_PUBLIC_TIMELOCKED"],
  ["LeakProofDAO", "NEXT_PUBLIC_DAO"],
] as const;

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

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error("Missing SEPOLIA_RPC_URL");
  }

  const deployed = readEnv(path.join(contractsDir, ".env.deployed"));
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error(`Expected Sepolia chainId 11155111, received ${network.chainId}`);
  }

  for (const [label, key] of required) {
    const address = deployed[key];
    if (!ethers.isAddress(address)) {
      throw new Error(`${label} has invalid address: ${address}`);
    }

    const bytecode = await provider.getCode(address);
    if (!bytecode || bytecode === "0x") {
      throw new Error(`${label} has no deployed bytecode at ${address}`);
    }

    console.log(`${label}: ${address} (${(bytecode.length - 2) / 2} bytes)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

