"use client";

import { useReadContract } from 'wagmi';
import { ACCESS_CONTROL_ABI, CONTRACTS } from '@/lib/contracts';

export function useAccessControl() {
  const checkIsAdmin = (address: string) => {
    return useReadContract({
      address: CONTRACTS.ACCESS_CONTROL as `0x${string}`,
      abi: ACCESS_CONTROL_ABI,
      functionName: 'isAdmin',
      args: [address as `0x${string}`],
      query: { enabled: !!address },
    });
  };

  const checkIsReviewer = (address: string) => {
    return useReadContract({
      address: CONTRACTS.ACCESS_CONTROL as `0x${string}`,
      abi: ACCESS_CONTROL_ABI,
      functionName: 'isReviewer',
      args: [address as `0x${string}`],
      query: { enabled: !!address },
    });
  };

  return { checkIsAdmin, checkIsReviewer };
}

export function useUserRole(address: string | undefined) {
  const { checkIsAdmin, checkIsReviewer } = useAccessControl();

  const { data: isAdmin } = address ? checkIsAdmin(address) : { data: false };
  const { data: isReviewer } = address ? checkIsReviewer(address) : { data: false };

  if (isAdmin) return 'admin';
  if (isReviewer) return 'reviewer';
  if (address) return 'reporter';
  return 'guest';
}