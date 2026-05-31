import type { PublicClient } from 'viem';
import { CONTRACTS, CORE_ABI, REVIEWER_HUB_ABI } from '@/lib/contracts';

export type IndexedActivity = {
  type: 'CaseCreated' | 'StatusUpdated' | 'ReviewerAssigned' | 'VoteSubmitted';
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  caseId: number;
  actor?: `0x${string}`;
};

export async function loadIndexedActivity(publicClient: PublicClient, lookbackBlocks = 50_000n) {
  const latestBlock = await publicClient.getBlockNumber();
  const fromBlock = latestBlock > lookbackBlocks ? latestBlock - lookbackBlocks : 0n;

  const [created, status, assigned, votes] = await Promise.all([
    publicClient.getContractEvents({
      address: CONTRACTS.CORE,
      abi: CORE_ABI,
      eventName: 'CaseCreated',
      fromBlock,
      toBlock: latestBlock,
      strict: true,
    }),
    publicClient.getContractEvents({
      address: CONTRACTS.CORE,
      abi: CORE_ABI,
      eventName: 'StatusUpdated',
      fromBlock,
      toBlock: latestBlock,
      strict: true,
    }),
    publicClient.getContractEvents({
      address: CONTRACTS.REVIEWER_HUB,
      abi: REVIEWER_HUB_ABI,
      eventName: 'ReviewerAssigned',
      fromBlock,
      toBlock: latestBlock,
      strict: true,
    }),
    publicClient.getContractEvents({
      address: CONTRACTS.REVIEWER_HUB,
      abi: REVIEWER_HUB_ABI,
      eventName: 'VoteSubmitted',
      fromBlock,
      toBlock: latestBlock,
      strict: true,
    }),
  ]);

  const activity: IndexedActivity[] = [
    ...created.map((log) => ({
      type: 'CaseCreated' as const,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      caseId: Number(log.args.caseId),
      actor: log.args.reporter,
    })),
    ...status.map((log) => ({
      type: 'StatusUpdated' as const,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      caseId: Number(log.args.caseId),
      actor: log.args.updater,
    })),
    ...assigned.map((log) => ({
      type: 'ReviewerAssigned' as const,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      caseId: Number(log.args.caseId),
      actor: log.args.reviewer,
    })),
    ...votes.map((log) => ({
      type: 'VoteSubmitted' as const,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      caseId: Number(log.args.caseId),
      actor: log.args.reviewer,
    })),
  ];

  return {
    latestBlock,
    fromBlock,
    activity: activity.sort((left, right) => Number(right.blockNumber - left.blockNumber)),
  };
}

