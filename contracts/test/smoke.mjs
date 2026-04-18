import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
import { ethers } from "ethers";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { createCofheClient, createCofheConfig } from "@cofhe/sdk/node";
import { sepolia as cofheSepolia } from "@cofhe/sdk/chains";
import { PermitUtils } from "@cofhe/sdk/permits";
import naclModule from "tweetnacl";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia as viemSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractsDir = path.resolve(__dirname, "..");
const repoDir = path.resolve(contractsDir, "..");

dotenv.config({ path: path.join(repoDir, ".env") });

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readEnvFile(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const env = {};

  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    env[line.slice(0, separator)] = line.slice(separator + 1);
  }

  return env;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizePrivateKey(value) {
  return value.startsWith("0x") ? value : `0x${value}`;
}

function toHexString(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHexString(hexString) {
  const clean = hexString.replace(/^0x/, "");
  const matches = clean.match(/.{1,2}/g) ?? [];
  return new Uint8Array(matches.map((byte) => Number.parseInt(byte, 16)));
}

function createSealingPair() {
  const nacl = naclModule?.default ?? naclModule;
  const raw = nacl.box.keyPair();
  const privateKey = toHexString(raw.secretKey);
  const publicKey = toHexString(raw.publicKey);

  return {
    privateKey,
    publicKey,
    serialize() {
      return { privateKey, publicKey };
    },
    unseal(ciphertext) {
      const nonce = ciphertext.nonce instanceof Uint8Array ? ciphertext.nonce : new Uint8Array(ciphertext.nonce);
      const ephemPublicKey =
        ciphertext.public_key instanceof Uint8Array
          ? ciphertext.public_key
          : new Uint8Array(ciphertext.public_key);
      const data = ciphertext.data instanceof Uint8Array ? ciphertext.data : new Uint8Array(ciphertext.data);
      const decrypted = nacl.box.open(data, nonce, ephemPublicKey, fromHexString(privateKey));

      if (!decrypted) {
        throw new Error("Failed to unseal permit ciphertext");
      }

      return BigInt(`0x${toHexString(decrypted)}`);
    },
  };
}

async function createSelfPermit(publicClient, walletClient, issuer) {
  const expiration = Math.round(Date.now() / 1000) + 60 * 60;
  const permit = {
    hash: PermitUtils.getHash({
      type: "self",
      issuer,
      expiration,
      recipient: ethers.ZeroAddress,
      validatorId: 0,
      validatorContract: ethers.ZeroAddress,
    }),
    name: "Smoke Permit",
    type: "self",
    issuer,
    expiration,
    recipient: ethers.ZeroAddress,
    validatorId: 0,
    validatorContract: ethers.ZeroAddress,
    issuerSignature: "0x",
    recipientSignature: "0x",
    sealingPair: createSealingPair(),
    _signedDomain: undefined,
  };

  return PermitUtils.sign(permit, publicClient, walletClient);
}

function findCaseId(receipt, coreAbi) {
  const iface = new ethers.Interface(coreAbi);

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "CaseCreated") {
        return Number(parsed.args.caseId);
      }
    } catch {
      // Ignore unrelated logs.
    }
  }

  throw new Error("Unable to parse CaseCreated from receipt");
}

async function waitAndLog(txPromise, label) {
  const tx = await txPromise;
  console.log(`${label}: ${tx.hash}`);
  return tx.wait();
}

async function withRetries(label, fn, attempts = 6, delayMs = 5000) {
  let lastError = null;

  for (let index = 0; index < attempts; index += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error?.context?.status;
      if (status !== 428 || index === attempts - 1) {
        throw error;
      }

      console.log(`${label}: threshold network not ready yet, retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

async function main() {
  const rpcUrl = requireEnv("SEPOLIA_RPC_URL");
  const privateKey = normalizePrivateKey(requireEnv("PRIVATE_KEY"));
  const deployed = readEnvFile(path.join(contractsDir, ".env.deployed"));

  const accessAbi = readJson(
    path.join(contractsDir, "artifacts", "contracts", "AccessControl.sol", "LeakProofAccessControl.json")
  ).abi;
  const coreAbi = readJson(
    path.join(contractsDir, "artifacts", "contracts", "LeakProofCore.sol", "LeakProofCore.json")
  ).abi;
  const reviewerHubAbi = readJson(
    path.join(contractsDir, "artifacts", "contracts", "ReviewerHub.sol", "ReviewerHub.json")
  ).abi;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const publicClient = createPublicClient({
    chain: viemSepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: viemSepolia,
    transport: http(rpcUrl),
  });

  const cofheClient = createCofheClient(
    createCofheConfig({
      supportedChains: [cofheSepolia],
    })
  );

  await cofheClient.connect(publicClient, walletClient);
  const permit = await createSelfPermit(publicClient, walletClient, wallet.address);

  const accessControl = new ethers.Contract(deployed.NEXT_PUBLIC_ACCESS_CONTROL, accessAbi, wallet);
  const core = new ethers.Contract(deployed.NEXT_PUBLIC_CORE, coreAbi, wallet);
  const reviewerHub = new ethers.Contract(deployed.NEXT_PUBLIC_REVIEWER_HUB, reviewerHubAbi, wallet);

  if (!(await accessControl.isReviewer(wallet.address))) {
    await waitAndLog(accessControl.grantReviewerRole(wallet.address), "Granted reviewer role");
  }

  const [encryptedReporterSeverity] = await cofheClient
    .encryptInputs([Encryptable.uint8(4n)])
    .execute();

  const createReceipt = await waitAndLog(
    core.createCase(
      `bafy-smoke-${Date.now()}`,
      ethers.keccak256(ethers.toUtf8Bytes(`smoke-${Date.now()}`)),
      0,
      encryptedReporterSeverity,
      "",
      ethers.ZeroHash
    ),
    "Created confidential case"
  );

  const caseId = findCaseId(createReceipt, coreAbi);

  await waitAndLog(reviewerHub.setApprovalThreshold(caseId, 1), "Set approval threshold");
  await waitAndLog(reviewerHub.assignReviewer(caseId, wallet.address), "Assigned reviewer");

  const encryptedSeverityHandle = await core.getEncryptedReporterSeverity(caseId);
  const decryptedReporterSeverity = await withRetries("Decrypt reporter severity", () =>
    cofheClient.decryptForView(encryptedSeverityHandle, FheTypes.Uint8).withPermit(permit).execute()
  );

  if (Number(decryptedReporterSeverity) !== 4) {
    throw new Error(`Unexpected confidential reporter severity: ${decryptedReporterSeverity}`);
  }

  const [encryptedRecommendation, encryptedVoteSeverity] = await cofheClient
    .encryptInputs([Encryptable.uint8(1n), Encryptable.uint8(5n)])
    .execute();

  await waitAndLog(
    reviewerHub.submitVote(caseId, encryptedRecommendation, encryptedVoteSeverity, "smoke-review"),
    "Submitted confidential vote"
  );

  const encryptedSummary = await reviewerHub.getEncryptedVoteSummary(caseId);

  const approvals = await withRetries("Decrypt approvals", () =>
    cofheClient.decryptForTx(encryptedSummary[0]).withPermit(permit).execute()
  );
  const rejects = await withRetries("Decrypt rejects", () =>
    cofheClient.decryptForTx(encryptedSummary[1]).withPermit(permit).execute()
  );
  const escalations = await withRetries("Decrypt escalations", () =>
    cofheClient.decryptForTx(encryptedSummary[2]).withPermit(permit).execute()
  );
  const averageSeverity = await withRetries("Decrypt average severity", () =>
    cofheClient.decryptForTx(encryptedSummary[3]).withPermit(permit).execute()
  );

  await waitAndLog(
    reviewerHub.publishConsensus(
      caseId,
      Number(approvals.decryptedValue),
      Number(rejects.decryptedValue),
      Number(escalations.decryptedValue),
      Number(averageSeverity.decryptedValue),
      [approvals.signature, rejects.signature, escalations.signature, averageSeverity.signature]
    ),
    "Published verified consensus"
  );

  const caseData = await core.getCase(caseId);
  const status = Number(caseData[8]);
  const approvalCount = Number(caseData[11]);
  const averageSeverityScore = Number(caseData[14]);

  if (status !== 4) {
    throw new Error(`Expected case status Verified (4), received ${status}`);
  }

  if (approvalCount !== 1) {
    throw new Error(`Expected approvalCount 1, received ${approvalCount}`);
  }

  if (averageSeverityScore !== 5) {
    throw new Error(`Expected averageSeverityScore 5, received ${averageSeverityScore}`);
  }

  console.log(`Smoke test passed for case #${caseId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
