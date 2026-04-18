"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REVIEWER_HUB_ABI, CONTRACTS } from '@/lib/contracts';

export function useReviewerHub() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const assignReviewer = (caseId: number, reviewer: string) => {
    writeContract({
      address: CONTRACTS.REVIEWER_HUB as `0x${string}`,
      abi: REVIEWER_HUB_ABI as any,
      functionName: 'assignReviewer',
      args: [BigInt(caseId), reviewer as `0x${string}`],
    } as any);
  };

  return {
    assignReviewer,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useReviewerVotes(caseId: number) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.REVIEWER_HUB as `0x${string}`,
    abi: REVIEWER_HUB_ABI,
    functionName: 'getReviewerVotes',
    args: [BigInt(caseId)],
  });

  return {
    votes: data,
    isLoading,
  };
}

export function useSubmitVote() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const submitVote = (params: {
    caseId: bigint;
    encryptedVote: `0x${string}`;
    encryptedScore: `0x${string}`;
    encryptedNotes: `0x${string}`;
  }) => {
    writeContract({
      address: CONTRACTS.REVIEWER_HUB as `0x${string}`,
      abi: REVIEWER_HUB_ABI as any,
      functionName: 'submitVote',
      args: [
        params.caseId,
        params.encryptedVote,
        params.encryptedScore,
        params.encryptedNotes,
      ],
    } as any);
  };

  return {
    submitVote,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}