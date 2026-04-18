"use client";

import { decodeEventLog } from "viem";
import {
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { CONTRACTS, CORE_ABI, normalizeCaseRecord } from "@/lib/contracts";
import type { CaseRecord, CreateCaseInput } from "@/types";

export function useCaseRegistry() {
  const { data: caseCount, isLoading } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "caseCount",
  });

  const { data: allCaseIds, isLoading: idsLoading } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "getAllCases",
  });

  return {
    caseCount: Number(caseCount ?? 0n),
    allCaseIds: ((allCaseIds as bigint[] | undefined) ?? []).map((value) => Number(value)),
    isLoading: isLoading || idsLoading,
  };
}

export function useAllCaseIds() {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "getAllCases",
  });

  return {
    caseIds: ((data as bigint[] | undefined) ?? []).map((value) => Number(value)),
    isLoading,
  };
}

export function useReporterCases(address: string | undefined) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "getCasesByReporter",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  return {
    caseIds: ((data as bigint[] | undefined) ?? []).map((value) => Number(value)),
    isLoading,
  };
}

export function useCases(caseIds: number[]) {
  const { data, isLoading, refetch } = useReadContracts({
    contracts: caseIds.map((caseId) => ({
      address: CONTRACTS.CORE,
      abi: CORE_ABI,
      functionName: "getCase",
      args: [BigInt(caseId)],
    })),
    query: {
      enabled: caseIds.length > 0,
    },
  });

  const cases =
    data?.flatMap((result, index) =>
      result.status === "success" && Array.isArray(result.result)
        ? [normalizeCaseRecord(caseIds[index], result.result as readonly unknown[])]
        : []
    ) ?? [];

  return {
    cases,
    isLoading,
    refetch,
  };
}

export function useCase(caseId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "getCase",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  return {
    caseData: Array.isArray(data) ? normalizeCaseRecord(caseId, data as readonly unknown[]) : null,
    isLoading,
    error,
    refetch,
  };
}

export function useCaseStatus(caseId: number) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "getCaseStatus",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  return {
    status: Number(data ?? 0),
    isLoading,
  };
}

export function useCaseReviewers(caseId: number) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "getCaseReviewers",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  return {
    reviewers: (data as `0x${string}`[] | undefined) ?? [],
    isLoading,
  };
}

export function useCreateCase() {
  const publicClient = usePublicClient();
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();

  const createCase = async (input: CreateCaseInput) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.CORE,
      abi: CORE_ABI,
      functionName: "createCase",
      args: [
        input.reportCid,
        input.reportDigest,
        BigInt(input.category),
        input.evidenceCid ?? "",
        input.evidenceDigest ??
          "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    let caseId: number | null = null;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== CONTRACTS.CORE.toLowerCase()) {
        continue;
      }

      try {
        const parsed = decodeEventLog({
          abi: CORE_ABI,
          data: log.data,
          topics: log.topics,
          eventName: "CaseCreated",
        });

        caseId = Number(parsed.args.caseId);
        break;
      } catch {
        // Ignore unrelated logs.
      }
    }

    if (!caseId) {
      throw new Error("Transaction confirmed but case ID was not found in the receipt");
    }

    return { caseId, hash, receipt };
  };

  return {
    createCase,
    txHash,
    isPending,
    error,
  };
}
