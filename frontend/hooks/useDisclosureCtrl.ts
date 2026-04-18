"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { DISCLOSURE_CTRL_ABI, CONTRACTS } from '@/lib/contracts';

export function useDisclosureCtrl() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const grantAccess = (caseId: number, grantee: string, level: number) => {
    writeContract({
      address: CONTRACTS.DISCLOSURE_CTRL as `0x${string}`,
      abi: DISCLOSURE_CTRL_ABI as any,
      functionName: 'grantDisclosureAccess',
      args: [BigInt(caseId), grantee as `0x${string}`, BigInt(level)],
    } as any);
  };

  return {
    grantAccess,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function usePermissionLevel(caseId: number, address: string) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.DISCLOSURE_CTRL as `0x${string}`,
    abi: DISCLOSURE_CTRL_ABI,
    functionName: 'getPermissionLevel',
    args: [BigInt(caseId), address as `0x${string}`],
  });

  return {
    level: data ? Number(data) : 0,
    isLoading,
  };
}

export function useCanAccessCase(address: string, caseId: number) {
  const { data, isLoading } = useReadContract({
    address: CONTRACTS.DISCLOSURE_CTRL as `0x${string}`,
    abi: DISCLOSURE_CTRL_ABI,
    functionName: 'canAccessCase',
    args: [address as `0x${string}`, BigInt(caseId)],
  });

  return {
    canAccess: data ? data[0] : false,
    permissionLevel: data ? Number(data[1]) : 0,
    isLoading,
  };
}