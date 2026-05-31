"use client";

import { formatUnits } from "viem";
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
      { internalType: "uint256", name: "snapshotBlock", type: "uint256" },
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
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "proposalDescriptions",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposalActions",
    outputs: [
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
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
    inputs: [{ internalType: "uint256", name: "newFee", type: "uint256" }],
    name: "setPlatformFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newRewardBP", type: "uint256" }],
    name: "setReviewerReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "newThreshold", type: "uint32" }],
    name: "setCaseApprovalThreshold",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint32", name: "newMax", type: "uint32" }],
    name: "setMaxReviewersPerCase",
    outputs: [],
    stateMutability: "nonpayable",
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

export const GOVERNANCE_TOKEN_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getVotes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "delegates",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "delegatee", type: "address" }],
    name: "delegate",
    outputs: [],
    stateMutability: "nonpayable",
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

  const { data: description } = useReadContract({
    address: DAO_CONTRACT,
    abi: DAO_ABI,
    functionName: "proposalDescriptions",
    args: [BigInt(proposalId)],
    query: { enabled: proposalId >= 0 && isContractConfigured(DAO_CONTRACT) },
  });

  const { data: actionsData } = useReadContract({
    address: DAO_CONTRACT,
    abi: DAO_ABI,
    functionName: "getProposalActions",
    args: [BigInt(proposalId)],
    query: { enabled: proposalId >= 0 && isContractConfigured(DAO_CONTRACT) },
  });

  return {
    proposal: data
      ? {
          proposer: String(data[0]),
          descriptionHash: String(data[1]),
          snapshotBlock: Number(data[2]),
          startTime: Number(data[3]),
          endTime: Number(data[4]),
          forVotes: data[5],
          againstVotes: data[6],
          abstainVotes: data[7],
          quorumVotes: data[8],
          actionsHash: String(data[9]),
          executed: Boolean(data[10]),
          cancelled: Boolean(data[11]),
          queuedAt: String(data[12]),
          state: Number(stateData ?? 0),
          stateLabel: PROPOSAL_STATES[Number(stateData ?? 0)] ?? "Unknown",
          forVotesNum: Number(votesData?.[0] ?? 0n),
          againstVotesNum: Number(votesData?.[1] ?? 0n),
          abstainVotesNum: Number(votesData?.[2] ?? 0n),
          description: String(description ?? ""),
          actionCount: actionsData?.[0]?.length ?? 0,
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

  const propose = async (
    description: string,
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[]
  ) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    ensureConfigured();
    const hash = await writeContractAsync({
      address: contract,
      abi: DAO_ABI,
      functionName: "propose",
      args: [targets, values, calldatas, description],
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

  const executeProposal = async (proposalId: number) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    ensureConfigured();
    const hash = await writeContractAsync({
      address: contract,
      abi: DAO_ABI,
      functionName: "executeProposal",
      args: [BigInt(proposalId)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return { propose, castVote, executeProposal, isPending, error };
}

export function useGovernancePower(address: string | undefined) {
  const enabled = Boolean(address) && isContractConfigured(CONTRACTS.TOKEN);

  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.TOKEN,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled },
  });

  const { data: votes, isLoading: votesLoading, refetch: refetchVotes } = useReadContract({
    address: CONTRACTS.TOKEN,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: "getVotes",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled },
  });

  const { data: delegatee, refetch: refetchDelegatee } = useReadContract({
    address: CONTRACTS.TOKEN,
    abi: GOVERNANCE_TOKEN_ABI,
    functionName: "delegates",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled },
  });

  return {
    balance: balance ?? 0n,
    votes: votes ?? 0n,
    balanceLabel: formatUnits(balance ?? 0n, 18),
    votesLabel: formatUnits(votes ?? 0n, 18),
    delegatee: delegatee ?? null,
    isLoading: balanceLoading || votesLoading,
    refetch: () => {
      void refetchBalance();
      void refetchVotes();
      void refetchDelegatee();
    },
  };
}

export function useGovernanceTokenActions() {
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending, error } = useWriteContract();

  const delegateVotes = async (delegatee: string) => {
    if (!publicClient) throw new Error("Wallet client unavailable");
    if (!isContractConfigured(CONTRACTS.TOKEN)) {
      throw new Error("Governance token is not configured for this deployment.");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.TOKEN,
      abi: GOVERNANCE_TOKEN_ABI,
      functionName: "delegate",
      args: [delegatee as `0x${string}`],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return { delegateVotes, isPending, error };
}
