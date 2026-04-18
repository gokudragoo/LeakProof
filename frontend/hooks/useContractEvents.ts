"use client";

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS, CORE_ABI, REVIEWER_HUB_ABI } from '@/lib/contracts';

export interface CaseCreatedEvent {
  caseId: bigint;
  reporter: `0x${string}`;
  status: number;
  timestamp: bigint;
}

export interface StatusUpdatedEvent {
  caseId: bigint;
  oldStatus: number;
  newStatus: number;
  updater: `0x${string}`;
}

export interface ReviewerAssignedEvent {
  caseId: bigint;
  reviewer: `0x${string}`;
  assigner: `0x${string}`;
}

export interface VoteSubmittedEvent {
  caseId: bigint;
  reviewer: `0x${string}`;
}

export interface ConsensusReachedEvent {
  caseId: bigint;
  approvals: bigint;
}

export function useContractEvents() {
  const publicClient = usePublicClient();
  const [caseCreatedEvents, setCaseCreatedEvents] = useState<CaseCreatedEvent[]>([]);
  const [statusUpdatedEvents, setStatusUpdatedEvents] = useState<StatusUpdatedEvent[]>([]);
  const [reviewerAssignedEvents, setReviewerAssignedEvents] = useState<ReviewerAssignedEvent[]>([]);
  const [voteSubmittedEvents, setVoteSubmittedEvents] = useState<VoteSubmittedEvent[]>([]);
  const [consensusReachedEvents, setConsensusReachedEvents] = useState<ConsensusReachedEvent[]>([]);

  useEffect(() => {
    if (!publicClient) return;

    const unwatchCaseCreated = publicClient.watchContractEvent({
      address: CONTRACTS.CORE as `0x${string}`,
      abi: CORE_ABI as any,
      eventName: 'CaseCreated',
      onLogs: (logs) => {
        const events: CaseCreatedEvent[] = logs.map((log: any) => ({
          caseId: log.args?.caseId ?? 0n,
          reporter: log.args?.reporter ?? '0x',
          status: log.args?.status ?? 0,
          timestamp: log.args?.timestamp ?? 0n,
        }));
        setCaseCreatedEvents((prev) => [...events, ...prev]);
      },
    });

    const unwatchStatusUpdated = publicClient.watchContractEvent({
      address: CONTRACTS.CORE as `0x${string}`,
      abi: CORE_ABI as any,
      eventName: 'StatusUpdated',
      onLogs: (logs) => {
        const events: StatusUpdatedEvent[] = logs.map((log: any) => ({
          caseId: log.args?.caseId ?? 0n,
          oldStatus: log.args?.oldStatus ?? 0,
          newStatus: log.args?.newStatus ?? 0,
          updater: log.args?.updater ?? '0x',
        }));
        setStatusUpdatedEvents((prev) => [...events, ...prev]);
      },
    });

    const unwatchReviewerAssigned = publicClient.watchContractEvent({
      address: CONTRACTS.REVIEWER_HUB as `0x${string}`,
      abi: REVIEWER_HUB_ABI as any,
      eventName: 'ReviewerAssigned',
      onLogs: (logs) => {
        const events: ReviewerAssignedEvent[] = logs.map((log: any) => ({
          caseId: log.args?.caseId ?? 0n,
          reviewer: log.args?.reviewer ?? '0x',
          assigner: log.args?.assigner ?? '0x',
        }));
        setReviewerAssignedEvents((prev) => [...events, ...prev]);
      },
    });

    const unwatchVoteSubmitted = publicClient.watchContractEvent({
      address: CONTRACTS.REVIEWER_HUB as `0x${string}`,
      abi: REVIEWER_HUB_ABI as any,
      eventName: 'VoteSubmitted',
      onLogs: (logs) => {
        const events: VoteSubmittedEvent[] = logs.map((log: any) => ({
          caseId: log.args?.caseId ?? 0n,
          reviewer: log.args?.reviewer ?? '0x',
        }));
        setVoteSubmittedEvents((prev) => [...events, ...prev]);
      },
    });

    const unwatchConsensusReached = publicClient.watchContractEvent({
      address: CONTRACTS.REVIEWER_HUB as `0x${string}`,
      abi: REVIEWER_HUB_ABI as any,
      eventName: 'ConsensusReached',
      onLogs: (logs) => {
        const events: ConsensusReachedEvent[] = logs.map((log: any) => ({
          caseId: log.args?.caseId ?? 0n,
          approvals: log.args?.approvals ?? 0n,
        }));
        setConsensusReachedEvents((prev) => [...events, ...prev]);
      },
    });

    return () => {
      unwatchCaseCreated();
      unwatchStatusUpdated();
      unwatchReviewerAssigned();
      unwatchVoteSubmitted();
      unwatchConsensusReached();
    };
  }, [publicClient]);

  return {
    caseCreatedEvents,
    statusUpdatedEvents,
    reviewerAssignedEvents,
    voteSubmittedEvents,
    consensusReachedEvents,
  };
}

export function useRecentActivity(limit = 10) {
  const {
    caseCreatedEvents,
    statusUpdatedEvents,
    reviewerAssignedEvents,
    voteSubmittedEvents,
    consensusReachedEvents,
  } = useContractEvents();

  const activity = [
    ...caseCreatedEvents.map((e) => ({
      type: 'case_created' as const,
      caseId: Number(e.caseId),
      address: e.reporter,
      timestamp: Number(e.timestamp),
      description: `New case #${e.caseId} submitted`,
    })),
    ...statusUpdatedEvents.map((e) => ({
      type: 'status_updated' as const,
      caseId: Number(e.caseId),
      address: e.updater,
      timestamp: 0,
      description: `Case #${e.caseId} status changed to ${e.newStatus}`,
    })),
    ...reviewerAssignedEvents.map((e) => ({
      type: 'reviewer_assigned' as const,
      caseId: Number(e.caseId),
      address: e.assigner,
      timestamp: 0,
      description: `Reviewer assigned to case #${e.caseId}`,
    })),
    ...voteSubmittedEvents.map((e) => ({
      type: 'vote_submitted' as const,
      caseId: Number(e.caseId),
      address: e.reviewer,
      timestamp: 0,
      description: `Vote submitted for case #${e.caseId}`,
    })),
    ...consensusReachedEvents.map((e) => ({
      type: 'consensus_reached' as const,
      caseId: Number(e.caseId),
      address: '0x' as `0x${string}`,
      timestamp: 0,
      description: `Consensus reached on case #${e.caseId}`,
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  return activity;
}