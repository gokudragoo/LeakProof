"use client";

import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, isContractConfigured } from "@/lib/contracts";

const TIMELOCKED_CONTRACT = CONTRACTS.TIMELOCKED;

export const TIMELOCKED_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getDisclosureLockInfo",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "uint8", name: "", type: "uint8" },
      { internalType: "uint8", name: "", type: "uint8" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bool", name: "", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "unlockIfTimeElapsed",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "uint256", name: "lockDuration", type: "uint256" },
      { internalType: "uint8", name: "requiredApprovals", type: "uint8" },
      { internalType: "string", name: "disclosureType", type: "string" },
    ],
    name: "createDisclosureLock",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "approveDisclosureUnlock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyPauseActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "activateEmergencyPause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "deactivateEmergencyPause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useDisclosureLock(caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: TIMELOCKED_CONTRACT,
    abi: TIMELOCKED_ABI,
    functionName: "getDisclosureLockInfo",
    args: [BigInt(caseId)],
    query: { enabled: caseId > 0 && isContractConfigured(TIMELOCKED_CONTRACT) },
  });

  return {
    lock: data
      ? {
          unlockTimestamp: Number(data[0]),
          emergencyUnlock: Boolean(data[1]),
          revoked: Boolean(data[2]),
          requiredApprovals: Number(data[3]),
          currentApprovals: Number(data[4]),
          timeRemaining: Number(data[5]),
          canEmergencyUnlock: Boolean(data[6]),
        }
      : null,
    isLoading,
    refetch,
  };
}

export function useTimeLockedDisclosureActions() {
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const contract = TIMELOCKED_CONTRACT;

  const ensureConfigured = () => {
    if (!isContractConfigured(contract)) {
      throw new Error("Time-locked disclosure contract is not configured for this deployment.");
    }
  };

  const createLock = async (caseId: number, lockDuration: number, requiredApprovals: number, disclosureType: string) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    ensureConfigured();
    const hash = await writeContractAsync({
      address: contract,
      abi: TIMELOCKED_ABI,
      functionName: "createDisclosureLock",
      args: [BigInt(caseId), BigInt(lockDuration), requiredApprovals, disclosureType],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  const approveUnlock = async (caseId: number) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    ensureConfigured();
    const hash = await writeContractAsync({
      address: contract,
      abi: TIMELOCKED_ABI,
      functionName: "approveDisclosureUnlock",
      args: [BigInt(caseId)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  const triggerUnlock = async (caseId: number) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    ensureConfigured();
    const hash = await writeContractAsync({
      address: contract,
      abi: TIMELOCKED_ABI,
      functionName: "unlockIfTimeElapsed",
      args: [BigInt(caseId)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  const toggleEmergencyPause = async (activate: boolean) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    ensureConfigured();
    const hash = await writeContractAsync({
      address: contract,
      abi: TIMELOCKED_ABI,
      functionName: activate ? "activateEmergencyPause" : "deactivateEmergencyPause",
      args: [],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return { createLock, approveUnlock, triggerUnlock, toggleEmergencyPause, isPending, error };
}
