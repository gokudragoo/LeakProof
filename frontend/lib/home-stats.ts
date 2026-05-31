import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACTS, CORE_ABI, isContractConfigured, normalizeCaseRecord } from '@/lib/contracts';

export type HomeStatsSnapshot = {
  caseCount: number;
  verifiedCount: number;
  activeCount: number;
  sampledCases: number;
};

const STATS_TIMEOUT_MS = 7_000;
const MAX_CASES_FOR_STATS = 100;
const ACTIVE_REVIEW_STATUSES = new Set([0, 1, 2, 3]);

const emptyStats: HomeStatsSnapshot = {
  caseCount: 0,
  verifiedCount: 0,
  activeCount: 0,
  sampledCases: 0,
};

function withTimeout<T>(promise: Promise<T>) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Stats request timed out')), STATS_TIMEOUT_MS);
    }),
  ]);
}

export async function getHomeStats(): Promise<HomeStatsSnapshot> {
  if (!isContractConfigured(CONTRACTS.CORE)) {
    return emptyStats;
  }

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com', {
      retryCount: 1,
      timeout: 5_000,
    }),
  });

  return withTimeout((async () => {
    const caseCount = Number(await publicClient.readContract({
      address: CONTRACTS.CORE,
      abi: CORE_ABI,
      functionName: 'caseCount',
    }));

    const start = Math.max(1, caseCount - MAX_CASES_FOR_STATS + 1);
    const caseIds = Array.from({ length: Math.max(0, caseCount - start + 1) }, (_, index) => start + index);
    const results = await Promise.all(
      caseIds.map(async (caseId) => {
        const data = await publicClient.readContract({
          address: CONTRACTS.CORE,
          abi: CORE_ABI,
          functionName: 'getCase',
          args: [BigInt(caseId)],
        });
        return normalizeCaseRecord(caseId, data as readonly unknown[]);
      })
    );

    return {
      caseCount,
      verifiedCount: results.filter((item) => item.status === 4).length,
      activeCount: results.filter((item) => ACTIVE_REVIEW_STATUSES.has(item.status)).length,
      sampledCases: results.length,
    };
  })());
}
