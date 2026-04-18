"use client";

import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS, DISCLOSURE_CTRL_ABI } from "@/lib/contracts";

export function useDisclosureCtrl() {
  const publicClient = usePublicClient();
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();

  const grantAccess = async (caseId: number, grantee: string, level: number) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.DISCLOSURE_CTRL,
      abi: DISCLOSURE_CTRL_ABI,
      functionName: "grantDisclosureAccess",
      args: [BigInt(caseId), grantee as `0x${string}`, level],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  const revokeAccess = async (caseId: number, grantee: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.DISCLOSURE_CTRL,
      abi: DISCLOSURE_CTRL_ABI,
      functionName: "revokeDisclosureAccess",
      args: [BigInt(caseId), grantee as `0x${string}`],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return {
    grantAccess,
    revokeAccess,
    txHash,
    isPending,
    error,
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
