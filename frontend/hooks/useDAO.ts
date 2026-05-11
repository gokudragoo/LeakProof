"use client";

import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, isContractConfigured } from "@/lib/contracts";

const DAO_CONTRACT = CONTRACTS.DAO;

export const DAO_ABI = [
  {
    inputs: [],
    name: "proposalCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposalState",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposalVotes",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "proposals",
    outputs: [
      { internalType: "address", name: "proposer", type: "address" },
      { internalType: "bytes32", name: "descriptionHash", type: "bytes32" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "uint256", name: "forVotes", type: "uint256" },
      { internalType: "uint256", name: "againstVotes", type: "uint256" },
      { internalType: "uint256", name: "abstainVotes", type: "uint256" },
      { internalType: "uint256", name: "quorumVotes", type: "uint256" },
      { internalType: "bytes32", name: "actionsHash", type: "bytes32" },
      { internalType: "bool", name: "executed", type: "bool" },
      { internalType: "bool", name: "cancelled", type: "bool" },
      { internalType: "bytes32", name: "queuedAt", type: "bytes32" },
      { internalType: "uint8", name: "state", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "uint8", name: "voteType", type: "uint8" },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { internalType: "string", name: "description", type: "string" },
    ],
    name: "propose",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
    ],
    name: "executeProposal",
    outputs: [{ internalType: "bytes[]", name: "", type: "bytes[]" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "caseApprovalThreshold",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxReviewersPerCase",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "votingDelay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "votingPeriod",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const PROPOSAL_STATES = ["Pending", "Active", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];

export function useDAOProposalCount() {
  const { data, isLoading } = useReadContract({
    address: DAO_CONTRACT,
    abi: DAO_ABI,
    functionName: "proposalCount",
    query: { enabled: isContractConfigured(DAO_CONTRACT) },
  });
  return { count: Number(data ?? 0n), isLoading };
}

export function useDAOProposal(proposalId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: DAO_CONTRACT,
    abi: DAO_ABI,
    functionName: "proposals",
    args: [BigInt(proposalId)],
    query: { enabled: proposalId >= 0 && isContractConfigured(DAO_CONTRACT) },
  });

  const { data: stateData } = useReadContract({
    address: DAO_CONTRACT,
    abi: DAO_ABI,
    functionName: "getProposalState",
    args: [BigInt(proposalId)],
    query: { enabled: proposalId >= 0 && isContractConfigured(DAO_CONTRACT) },
  });

  const { data: votesData } = useReadContract({
    address: DAO_CONTRACT,
    abi: DAO_ABI,
    functionName: "getProposalVotes",
    args: [BigInt(proposalId)],
    query: { enabled: proposalId >= 0 && isContractConfigured(DAO_CONTRACT) },
  });

  return {
    proposal: data
      ? {
          proposer: String(data[0]),
          descriptionHash: String(data[1]),
          startTime: Number(data[2]),
          endTime: Number(data[3]),
          forVotes: data[4],
          againstVotes: data[5],
          abstainVotes: data[6],
          quorumVotes: data[7],
          actionsHash: String(data[8]),
          executed: Boolean(data[9]),
          cancelled: Boolean(data[10]),
          queuedAt: String(data[11]),
          state: Number(stateData ?? 0),
          stateLabel: PROPOSAL_STATES[Number(stateData ?? 0)] ?? "Unknown",
          forVotesNum: Number(votesData?.[0] ?? 0n),
          againstVotesNum: Number(votesData?.[1] ?? 0n),
          abstainVotesNum: Number(votesData?.[2] ?? 0n),
        }
      : null,
    isLoading,
    refetch,
  };
}

export function useDAOActions() {
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const contract = DAO_CONTRACT;

  const ensureConfigured = () => {
    if (!isContractConfigured(contract)) {
      throw new Error("DAO contract is not configured for this deployment.");
    }
  };

  const propose = async (description: string) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    ensureConfigured();
    const hash = await writeContractAsync({
      address: contract,
      abi: DAO_ABI,
      functionName: "propose",
      args: [[], [], [], description],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  const castVote = async (proposalId: number, voteType: 0 | 1 | 2) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    ensureConfigured();
    const hash = await writeContractAsync({
      address: contract,
      abi: DAO_ABI,
      functionName: "castVote",
      args: [BigInt(proposalId), voteType],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  const executeProposal = async (
    proposalId: number,
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[]
  ) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    ensureConfigured();
    const hash = await writeContractAsync({
      address: contract,
      abi: DAO_ABI,
      functionName: "executeProposal",
      args: [BigInt(proposalId), targets, values, calldatas],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return { propose, castVote, executeProposal, isPending, error };
}
