"use client";

import { transformEncryptedReturnTypes } from "@cofhe/abi";
import { decodeEventLog } from "viem";
import {
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { CONTRACTS, CORE_ABI, normalizeCaseRecord } from "@/lib/contracts";
import { recordTransactionObservation } from "@/lib/tx-observer";
import type { AddEvidenceInput, CaseRecord, CreateCaseInput, EncryptedHandle, EvidenceUpdateRecord } from "@/types";

const DEFAULT_CASE_PAGE_SIZE = 50;

function latestCaseIds(caseCount: number, limit = DEFAULT_CASE_PAGE_SIZE) {
  const count = Math.max(0, caseCount);
  const pageSize = Math.max(1, limit);
  const start = Math.max(1, count - pageSize + 1);
  const ids: number[] = [];

  for (let id = count; id >= start; id -= 1) {
    ids.push(id);
  }

  return ids;
}

export function useCaseRegistry() {
  const { data: caseCount, isLoading } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "caseCount",
  });

  const count = Number(caseCount ?? 0n);

  return {
    caseCount: count,
    allCaseIds: latestCaseIds(count),
    isLoading,
  };
}

export function useAllCaseIds(limit = DEFAULT_CASE_PAGE_SIZE) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "caseCount",
  });

  const count = Number(data ?? 0n);

  return {
    caseIds: latestCaseIds(count, limit),
    caseCount: count,
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

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.CORE,
        abi: CORE_ABI,
        functionName: "createCase",
        args: [
          input.reportCid,
          input.reportDigest,
          input.category,
          input.reporterSeverity,
          input.evidenceCid ?? "",
          input.evidenceDigest ??
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        ],
      } as Parameters<typeof writeContractAsync>[0]);

      recordTransactionObservation("Create confidential case", "submitted", { hash });
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

      recordTransactionObservation("Create confidential case", "confirmed", { hash });
      return { caseId, hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Create confidential case", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  return {
    createCase,
    txHash,
    isPending,
    error,
  };
}

export function useAddEvidence() {
  const publicClient = usePublicClient();
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();

  const addEvidence = async (input: AddEvidenceInput) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.CORE,
        abi: CORE_ABI,
        functionName: "addEvidence",
        args: [BigInt(input.caseId), input.evidenceCid, input.evidenceDigest],
      });

      recordTransactionObservation("Add encrypted evidence", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Add encrypted evidence", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Add encrypted evidence", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  return {
    addEvidence,
    txHash,
    isPending,
    error,
  };
}

export function useUpdateCaseStatus() {
  const publicClient = usePublicClient();
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();

  const updateStatus = async (caseId: number, status: number) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.CORE,
        abi: CORE_ABI,
        functionName: "updateStatus",
        args: [BigInt(caseId), status],
      });

      recordTransactionObservation("Update case status", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Update case status", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Update case status", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  return {
    updateStatus,
    txHash,
    isPending,
    error,
  };
}

export function useEvidenceUpdates(caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "getEvidenceUpdates",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  const updates: EvidenceUpdateRecord[] = ((data ?? []) as readonly {
    evidenceCid: string;
    evidenceDigest: `0x${string}`;
    submittedBy: `0x${string}`;
    submittedAt: bigint;
  }[]).map((item) => ({
    evidenceCid: item.evidenceCid,
    evidenceDigest: item.evidenceDigest,
    submittedBy: item.submittedBy,
    submittedAt: Number(item.submittedAt),
  }));

  return {
    updates,
    isLoading,
    refetch,
  };
}

export function useEncryptedReporterSeverity(caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.CORE,
    abi: CORE_ABI,
    functionName: "getEncryptedReporterSeverity",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  const transformed = data
    ? (transformEncryptedReturnTypes(
        CORE_ABI,
        "getEncryptedReporterSeverity",
        data as `0x${string}`
      ) as EncryptedHandle)
    : null;

  return {
    encryptedSeverity: transformed,
    isLoading,
    refetch,
  };
}
