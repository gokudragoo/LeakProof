"use client";

import { useReadContract } from 'wagmi';
import { ACCESS_CONTROL_ABI, CONTRACTS } from '@/lib/contracts';

export function useIsAdmin(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.ACCESS_CONTROL as `0x${string}`,
    abi: ACCESS_CONTROL_ABI as any,
    functionName: 'isAdmin',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });
}

export function useIsReviewer(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.ACCESS_CONTROL as `0x${string}`,
    abi: ACCESS_CONTROL_ABI as any,
    functionName: 'isReviewer',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });
}

export function useUserRole(address: string | undefined) {
  const { data: isAdmin } = useIsAdmin(address);
  const { data: isReviewer } = useIsReviewer(address);

  if (isAdmin) return 'admin';
  if (isReviewer) return 'reviewer';
  if (address) return 'reporter';
  return 'guest';
}