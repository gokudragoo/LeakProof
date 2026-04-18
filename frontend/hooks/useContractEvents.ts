"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { CONTRACTS, CORE_ABI, REVIEWER_HUB_ABI } from "@/lib/contracts";

export interface CaseCreatedEvent {
  caseId: bigint;
  reporter: `0x${string}`;
  category: number;
  reportCid: string;
  evidenceCid: string;
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
  recommendation: number;
  severityScore: number;
}

export function useContractEvents() {
  const publicClient = usePublicClient();
  const [caseCreatedEvents, setCaseCreatedEvents] = useState<CaseCreatedEvent[]>([]);
  const [statusUpdatedEvents, setStatusUpdatedEvents] = useState<StatusUpdatedEvent[]>([]);
  const [reviewerAssignedEvents, setReviewerAssignedEvents] = useState<ReviewerAssignedEvent[]>([]);
  const [voteSubmittedEvents, setVoteSubmittedEvents] = useState<VoteSubmittedEvent[]>([]);

  useEffect(() => {
    if (!publicClient) {
      return;
    }

    const unwatchCaseCreated = publicClient.watchContractEvent({
      address: CONTRACTS.CORE,
      abi: CORE_ABI,
      eventName: "CaseCreated",
      onLogs: (logs) => {
        const events = logs.map((log) => ({
          caseId: log.args.caseId ?? 0n,
          reporter: (log.args.reporter ?? CONTRACTS.ACCESS_CONTROL) as `0x${string}`,
          category: Number(log.args.category ?? 0),
          reportCid: String(log.args.reportCid ?? ""),
          evidenceCid: String(log.args.evidenceCid ?? ""),
          timestamp: log.args.timestamp ?? 0n,
        }));

        setCaseCreatedEvents((previous) => [...events, ...previous]);
      },
    });

    const unwatchStatusUpdated = publicClient.watchContractEvent({
      address: CONTRACTS.CORE,
      abi: CORE_ABI,
      eventName: "StatusUpdated",
      onLogs: (logs) => {
        const events = logs.map((log) => ({
          caseId: log.args.caseId ?? 0n,
          oldStatus: Number(log.args.oldStatus ?? 0),
          newStatus: Number(log.args.newStatus ?? 0),
          updater: (log.args.updater ?? CONTRACTS.ACCESS_CONTROL) as `0x${string}`,
        }));

        setStatusUpdatedEvents((previous) => [...events, ...previous]);
      },
    });

    const unwatchReviewerAssigned = publicClient.watchContractEvent({
      address: CONTRACTS.REVIEWER_HUB,
      abi: REVIEWER_HUB_ABI,
      eventName: "ReviewerAssigned",
      onLogs: (logs) => {
        const events = logs.map((log) => ({
          caseId: log.args.caseId ?? 0n,
          reviewer: (log.args.reviewer ?? CONTRACTS.ACCESS_CONTROL) as `0x${string}`,
          assigner: (log.args.assigner ?? CONTRACTS.ACCESS_CONTROL) as `0x${string}`,
        }));

        setReviewerAssignedEvents((previous) => [...events, ...previous]);
      },
    });

    const unwatchVoteSubmitted = publicClient.watchContractEvent({
      address: CONTRACTS.REVIEWER_HUB,
      abi: REVIEWER_HUB_ABI,
      eventName: "VoteSubmitted",
      onLogs: (logs) => {
        const events = logs.map((log) => ({
          caseId: log.args.caseId ?? 0n,
          reviewer: (log.args.reviewer ?? CONTRACTS.ACCESS_CONTROL) as `0x${string}`,
          recommendation: Number(log.args.recommendation ?? 0),
          severityScore: Number(log.args.severityScore ?? 0),
        }));

        setVoteSubmittedEvents((previous) => [...events, ...previous]);
      },
    });

    return () => {
      unwatchCaseCreated();
      unwatchStatusUpdated();
      unwatchReviewerAssigned();
      unwatchVoteSubmitted();
    };
  }, [publicClient]);

  return {
    caseCreatedEvents,
    statusUpdatedEvents,
    reviewerAssignedEvents,
    voteSubmittedEvents,
  };
}
