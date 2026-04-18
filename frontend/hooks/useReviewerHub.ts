"use client";

import { transformEncryptedReturnTypes } from "@cofhe/abi";
import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, REVIEWER_HUB_ABI } from "@/lib/contracts";
import type {
  ConfidentialVoteSummary,
  EncryptedHandle,
  VoteRecord,
  VoteSubmission,
  VoteSummary,
} from "@/types";

export function useReviewerHub() {
  const publicClient = usePublicClient();
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();

  const assignReviewer = async (caseId: number, reviewer: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.REVIEWER_HUB,
      abi: REVIEWER_HUB_ABI,
      functionName: "assignReviewer",
      args: [BigInt(caseId), reviewer as `0x${string}`],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  const setApprovalThreshold = async (caseId: number, threshold: number) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.REVIEWER_HUB,
      abi: REVIEWER_HUB_ABI,
      functionName: "setApprovalThreshold",
      args: [BigInt(caseId), BigInt(threshold)],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return {
    assignReviewer,
    setApprovalThreshold,
    txHash,
    isPending,
    error,
  };
}

export function useReviewerVoteStates(caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.REVIEWER_HUB,
    abi: REVIEWER_HUB_ABI,
    functionName: "getReviewerVoteStates",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  const reviewers = ((data?.[0] as `0x${string}`[] | undefined) ?? []).map((reviewer, index) => ({
    reviewer,
    hasVoted: Boolean(data?.[1]?.[index]),
  })) as VoteRecord[];

  return {
    votes: reviewers,
    isLoading,
    refetch,
  };
}

export function useEncryptedVoteSummary(caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.REVIEWER_HUB,
    abi: REVIEWER_HUB_ABI,
    functionName: "getEncryptedVoteSummary",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  const transformed = Array.isArray(data)
    ? (transformEncryptedReturnTypes(
        REVIEWER_HUB_ABI,
        "getEncryptedVoteSummary",
        data as readonly [`0x${string}`, `0x${string}`, `0x${string}`]
      ) as readonly [EncryptedHandle, EncryptedHandle, EncryptedHandle])
    : null;

  return {
    handles: transformed,
    isLoading,
    refetch,
  };
}

export function useVoteSummary(caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.REVIEWER_HUB,
    abi: REVIEWER_HUB_ABI,
    functionName: "getVoteSummary",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  const summary: VoteSummary = {
    approvals: Number(data?.[0] ?? 0),
    rejects: Number(data?.[1] ?? 0),
    escalations: Number(data?.[2] ?? 0),
    votes: Number(data?.[3] ?? 0),
  };

  return {
    summary,
    isLoading,
    refetch,
  };
}

export function useSubmitVote() {
  const publicClient = usePublicClient();
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();

  const submitVote = async (submission: VoteSubmission) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.REVIEWER_HUB,
      abi: REVIEWER_HUB_ABI,
      functionName: "submitVote",
      args: [
        BigInt(submission.caseId),
        submission.recommendation,
        submission.severityScore,
        submission.notes,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return {
    submitVote,
    txHash,
    isPending,
    error,
  };
}

export function useAuthorizeVoteSummaryAccess() {
  const publicClient = usePublicClient();
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();

  const authorize = async (caseId: number) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.REVIEWER_HUB,
      abi: REVIEWER_HUB_ABI,
      functionName: "authorizeVoteSummaryAccess",
      args: [BigInt(caseId)],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return {
    authorize,
    txHash,
    isPending,
    error,
  };
}

export function usePublishConsensus() {
  const publicClient = usePublicClient();
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();

  const publishConsensus = async (
    caseId: number,
    summary: ConfidentialVoteSummary,
    signatures: [`0x${string}`, `0x${string}`, `0x${string}`]
  ) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.REVIEWER_HUB,
      abi: REVIEWER_HUB_ABI,
      functionName: "publishConsensus",
      args: [
        BigInt(caseId),
        summary.approvals,
        summary.rejects,
        summary.escalations,
        signatures,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return {
    publishConsensus,
    txHash,
    isPending,
    error,
  };
}

export function useAssignedCases(reviewer: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.REVIEWER_HUB,
    abi: REVIEWER_HUB_ABI,
    functionName: "getAssignedCases",
    args: reviewer ? [reviewer as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(reviewer),
    },
  });

  return {
    assignedCases: ((data as bigint[] | undefined) ?? []).map((value) => Number(value)),
    isLoading,
    refetch,
  };
}

export function useIsReviewerAssigned(caseId: number, reviewer: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.REVIEWER_HUB,
    abi: REVIEWER_HUB_ABI,
    functionName: "isReviewerAssigned",
    args: reviewer ? [BigInt(caseId), reviewer as `0x${string}`] : undefined,
    query: {
      enabled: caseId > 0 && Boolean(reviewer),
    },
  });

  return {
    isAssigned: Boolean(data),
    isLoading,
    refetch,
  };
}

export function useApprovalThreshold(caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.REVIEWER_HUB,
    abi: REVIEWER_HUB_ABI,
    functionName: "approvalThreshold",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  return {
    threshold: Number(data ?? 0n),
    isLoading,
    refetch,
  };
}
