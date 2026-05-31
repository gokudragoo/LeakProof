"use client";

import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, DISCLOSURE_CTRL_ABI } from "@/lib/contracts";
import { recordTransactionObservation } from "@/lib/tx-observer";

export function useDisclosureCtrl() {
  const publicClient = usePublicClient();
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();

  const grantAccess = async (caseId: number, grantee: string, level: number) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.DISCLOSURE_CTRL,
        abi: DISCLOSURE_CTRL_ABI,
        functionName: "grantDisclosureAccess",
        args: [BigInt(caseId), grantee as `0x${string}`, level],
      });

      recordTransactionObservation("Grant disclosure access", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Grant disclosure access", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Grant disclosure access", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  const revokeAccess = async (caseId: number, grantee: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.DISCLOSURE_CTRL,
        abi: DISCLOSURE_CTRL_ABI,
        functionName: "revokeDisclosureAccess",
        args: [BigInt(caseId), grantee as `0x${string}`],
      });

      recordTransactionObservation("Revoke disclosure access", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Revoke disclosure access", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Revoke disclosure access", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  const requestAccess = async (caseId: number, level: number) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.DISCLOSURE_CTRL,
        abi: DISCLOSURE_CTRL_ABI,
        functionName: "requestDisclosure",
        args: [BigInt(caseId), level],
      });

      recordTransactionObservation("Request disclosure access", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Request disclosure access", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Request disclosure access", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  const resolveRequest = async (caseId: number, requestIndex: number, approved: boolean) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.DISCLOSURE_CTRL,
        abi: DISCLOSURE_CTRL_ABI,
        functionName: "resolveDisclosureRequest",
        args: [BigInt(caseId), BigInt(requestIndex), approved],
      });

      recordTransactionObservation("Resolve disclosure request", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Resolve disclosure request", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Resolve disclosure request", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  const revealIdentity = async (caseId: number, reporter: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.DISCLOSURE_CTRL,
        abi: DISCLOSURE_CTRL_ABI,
        functionName: "revealIdentity",
        args: [BigInt(caseId), reporter as `0x${string}`],
      });

      recordTransactionObservation("Reveal reporter identity", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Reveal reporter identity", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Reveal reporter identity", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  return {
    grantAccess,
    revokeAccess,
    requestAccess,
    resolveRequest,
    revealIdentity,
    txHash,
    isPending,
    error,
  };
}

export function useDisclosureRequests(caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.DISCLOSURE_CTRL,
    abi: DISCLOSURE_CTRL_ABI,
    functionName: "getDisclosureRequests",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  return {
    requests: (data ?? []).map((item, index) => ({
      index,
      requester: item.requester,
      caseId: Number(item.caseId),
      requestedLevel: Number(item.requestedLevel),
      approved: item.approved,
      resolved: item.resolved,
      timestamp: Number(item.timestamp),
    })),
    isLoading,
    refetch,
  };
}

export function useDisclosureLog(caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.DISCLOSURE_CTRL,
    abi: DISCLOSURE_CTRL_ABI,
    functionName: "getDisclosureLog",
    args: [BigInt(caseId)],
    query: {
      enabled: caseId > 0,
    },
  });

  return {
    permissions: (data ?? []).map((item) => ({
      grantee: item.grantee,
      caseId: Number(item.caseId),
      level: Number(item.level),
      revoked: item.revoked,
      grantedAt: Number(item.grantedAt),
      expiresAt: Number(item.expiresAt),
    })),
    isLoading,
    refetch,
  };
}

export function useIdentityReveal(caseId: number, reporter: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.DISCLOSURE_CTRL,
    abi: DISCLOSURE_CTRL_ABI,
    functionName: "hasIdentityRevealed",
    args: reporter ? [BigInt(caseId), reporter as `0x${string}`] : undefined,
    query: {
      enabled: caseId > 0 && Boolean(reporter),
    },
  });

  return {
    revealed: Boolean(data),
    isLoading,
    refetch,
  };
}

export function usePermissionLevel(caseId: number, address: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.DISCLOSURE_CTRL,
    abi: DISCLOSURE_CTRL_ABI,
    functionName: "getPermissionLevel",
    args: address ? [BigInt(caseId), address as `0x${string}`] : undefined,
    query: {
      enabled: caseId > 0 && Boolean(address),
    },
  });

  return {
    level: Number(data ?? 0),
    isLoading,
    refetch,
  };
}

export function useCanAccessCase(address: string | undefined, caseId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.DISCLOSURE_CTRL,
    abi: DISCLOSURE_CTRL_ABI,
    functionName: "canAccessCase",
    args: address ? [address as `0x${string}`, BigInt(caseId)] : undefined,
    query: {
      enabled: caseId > 0 && Boolean(address),
    },
  });

  return {
    canAccess: Boolean(data?.[0]),
    permissionLevel: Number(data?.[1] ?? 0),
    isLoading,
    refetch,
  };
}
