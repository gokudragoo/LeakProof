"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CORE_ABI, REVIEWER_HUB_ABI, CONTRACTS } from '@/lib/contracts';

export function useCaseRegistry() {
  const { data: caseCount, isLoading: countLoading } = useReadContract({
    address: CONTRACTS.CORE as `0x${string}`,
    abi: CORE_ABI as any,
    functionName: 'caseCount',
  });

  return {
    caseCount: caseCount ? Number(caseCount) : 0,
    isLoading: countLoading,
  };
}

export function useCase(caseId: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.CORE as `0x${string}`,
    abi: CORE_ABI as any,
    functionName: 'getCase',
    args: [BigInt(caseId)],
    query: { enabled: caseId > 0 },
  });

  return {
    caseData: data as any,
    isLoading,
    error,
  };
}

export function useCaseStatus(caseId: number) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.CORE as `0x${string}`,
    abi: CORE_ABI as any,
    functionName: 'getCaseStatus',
    args: [BigInt(caseId)],
    query: { enabled: caseId > 0 },
  });

  return {
    status: data ? Number(data) : 0,
    isLoading,
  };
}

export function useCreateCase() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const createCase = (params: {
    encryptedTitle: `0x${string}`;
    encryptedDescription: `0x${string}`;
    encryptedSeverity: bigint;
    category: bigint;
    evidenceCID: `0x${string}`;
  }) => {
    writeContract({
      address: CONTRACTS.CORE as `0x${string}`,
      abi: CORE_ABI as any,
      functionName: 'createCase',
      args: [
        params.encryptedTitle,
        params.encryptedDescription,
        params.encryptedSeverity,
        params.category,
        params.evidenceCID,
      ],
    } as any);
  };

  return {
    createCase,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCaseReviewers(caseId: number) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.CORE as `0x${string}`,
    abi: CORE_ABI as any,
    functionName: 'getCaseReviewers',
    args: [BigInt(caseId)],
    query: { enabled: caseId > 0 },
  });

  return {
    reviewers: (data as string[]) || [],
    isLoading,
  };
}