"use client";

import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, isContractConfigured } from "@/lib/contracts";

const REPUTATION_CONTRACT = CONTRACTS.REPUTATION;

export const REPUTATION_ABI = [
  {
    inputs: [{ internalType: "address", name: "reporter", type: "address" }],
    name: "getReporterProfile",
    outputs: [
      { internalType: "uint32", name: "", type: "uint32" },
      { internalType: "uint32", name: "", type: "uint32" },
      { internalType: "uint32", name: "", type: "uint32" },
      { internalType: "uint32", name: "", type: "uint32" },
      { internalType: "uint32", name: "", type: "uint32" },
      { internalType: "uint64", name: "", type: "uint64" },
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "bool", name: "", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "reviewer", type: "address" }],
    name: "getReviewerProfile",
    outputs: [
      { internalType: "uint32", name: "", type: "uint32" },
      { internalType: "uint32", name: "", type: "uint32" },
      { internalType: "uint32", name: "", type: "uint32" },
      { internalType: "uint32", name: "", type: "uint32" },
      { internalType: "uint32", name: "", type: "uint32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "reporter", type: "address" }],
    name: "isReporterTrusted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "reporter", type: "address" }],
    name: "isReporterSuspicious",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "createReporterCommitment",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useReporterReputation(address: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: REPUTATION_CONTRACT,
    abi: REPUTATION_ABI,
    functionName: "getReporterProfile",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: Boolean(address) && isContractConfigured(REPUTATION_CONTRACT) },
  });

  return {
    profile: data
      ? {
          totalReports: Number(data[0]),
          verifiedReports: Number(data[1]),
          rejectedReports: Number(data[2]),
          escalatedReports: Number(data[3]),
          credibilityScore: Number(data[4]),
          lastReportAt: Number(data[5]),
          isTrusted: Boolean(data[6]),
          isSuspicious: Boolean(data[7]),
        }
      : null,
    isLoading,
    refetch,
  };
}

export function useReviewerReputation(address: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: REPUTATION_CONTRACT,
    abi: REPUTATION_ABI,
    functionName: "getReviewerProfile",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: Boolean(address) && isContractConfigured(REPUTATION_CONTRACT) },
  });

  return {
    profile: data
      ? {
          totalReviews: Number(data[0]),
          accurateVotes: Number(data[1]),
          missedVotes: Number(data[2]),
          accuracyRate: Number(data[3]),
          avgSeverityGiven: Number(data[4]),
        }
      : null,
    isLoading,
    refetch,
  };
}

export function useReputationActions() {
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending, error } = useWriteContract();

  const createCommitment = async () => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    if (!isContractConfigured(REPUTATION_CONTRACT)) {
      throw new Error("Reputation contract is not configured for this deployment.");
    }

    const hash = await writeContractAsync({
      address: REPUTATION_CONTRACT,
      abi: REPUTATION_ABI,
      functionName: "createReporterCommitment",
      args: [],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return { createCommitment, isPending, error };
}
