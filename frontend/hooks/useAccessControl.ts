"use client";

import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { ACCESS_CONTROL_ABI, CONTRACTS } from "@/lib/contracts";
import { recordTransactionObservation } from "@/lib/tx-observer";
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

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "grantReviewerRole",
        args: [account as `0x${string}`],
      });

      recordTransactionObservation("Grant reviewer role", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Grant reviewer role", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Grant reviewer role", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  return {
    grantReviewerRole,
    isPending,
    txHash,
    error,
  };
}

export function useGrantAdminRole() {
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();

  const grantAdminRole = async (account: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "grantAdminRole",
        args: [account as `0x${string}`],
      });

      recordTransactionObservation("Grant admin role", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Grant admin role", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Grant admin role", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  return {
    grantAdminRole,
    isPending,
    txHash,
    error,
  };
}

export function useAdminRecoveryActions() {
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();

  const transferDefaultAdmin = async (newAdmin: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "transferDefaultAdmin",
        args: [newAdmin as `0x${string}`],
      });

      recordTransactionObservation("Transfer default admin", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Transfer default admin", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Transfer default admin", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  const revokeDefaultAdminRole = async (account: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "revokeDefaultAdminRole",
        args: [account as `0x${string}`],
      });

      recordTransactionObservation("Revoke default admin", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Revoke default admin", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Revoke default admin", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  const rotateDefaultAdmin = async (newAdmin: string, previousAdmin: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "rotateDefaultAdmin",
        args: [newAdmin as `0x${string}`, previousAdmin as `0x${string}`],
      });

      recordTransactionObservation("Rotate default admin", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Rotate default admin", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Rotate default admin", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  const recoverReviewerRole = async (compromisedReviewer: string, replacementReviewer: string) => {
    if (!publicClient) {
      throw new Error("Wallet client unavailable");
    }

    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.ACCESS_CONTROL,
        abi: ACCESS_CONTROL_ABI,
        functionName: "recoverReviewerRole",
        args: [compromisedReviewer as `0x${string}`, replacementReviewer as `0x${string}`],
      });

      recordTransactionObservation("Recover reviewer role", "submitted", { hash });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      recordTransactionObservation("Recover reviewer role", "confirmed", { hash });
      return { hash, receipt };
    } catch (actionError) {
      recordTransactionObservation("Recover reviewer role", "failed", {
        message: actionError instanceof Error ? actionError.message : "Unknown transaction failure",
      });
      throw actionError;
    }
  };

  return {
    transferDefaultAdmin,
    rotateDefaultAdmin,
    revokeDefaultAdminRole,
    recoverReviewerRole,
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
