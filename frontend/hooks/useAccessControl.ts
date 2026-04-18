"use client";

import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { ACCESS_CONTROL_ABI, CONTRACTS } from "@/lib/contracts";
import type { UserRole } from "@/types";

export function useIsAdmin(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.ACCESS_CONTROL,
    abi: ACCESS_CONTROL_ABI,
    functionName: "isAdmin",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });
}

export function useIsReviewer(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.ACCESS_CONTROL,
    abi: ACCESS_CONTROL_ABI,
    functionName: "isReviewer",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });
}

export function useIsReporter(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.ACCESS_CONTROL,
    abi: ACCESS_CONTROL_ABI,
    functionName: "isReporter",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });
}

export function useGrantReviewerRole() {
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();

  const grantReviewerRole = async (account: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    const hash = await writeContractAsync({
      address: CONTRACTS.ACCESS_CONTROL,
      abi: ACCESS_CONTROL_ABI,
      functionName: "grantReviewerRole",
      args: [account as `0x${string}`],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  };

  return {
    grantReviewerRole,
    isPending,
    txHash,
    error,
  };
}

export function useUserRole(address: string | undefined): UserRole {
  const { data: isAdmin } = useIsAdmin(address);
  const { data: isReviewer } = useIsReviewer(address);
  const { data: isReporter } = useIsReporter(address);

  if (isAdmin) {
    return "admin";
  }

  if (isReviewer) {
    return "reviewer";
  }

  if (isReporter || address) {
    return "reporter";
  }

  return "guest";
}
