export interface CaseRecord {
  id: number;
  reportCid: string;
  reportDigest: `0x${string}`;
  category: number;
  evidenceCid: string;
  evidenceDigest: `0x${string}`;
  reporter: `0x${string}`;
  createdAt: number;
  updatedAt: number;
  status: number;
  reviewerCount: number;
  voteCount: number;
  approvalCount: number;
  rejectCount: number;
  escalationCount: number;
  averageSeverityScore: number;
}

export interface ReportPayload {
  title: string;
  description: string;
  severity: number;
  category: number;
  createdAt: string;
  reporterAddress: string;
  evidenceName?: string;
}

export interface VoteRecord {
  reviewer: `0x${string}`;
  hasVoted: boolean;
  recommendation: number;
  severityScore: number;
}

export interface VoteSummary {
  approvals: number;
  rejects: number;
  escalations: number;
  votes: number;
}

export interface DisclosurePermission {
  caseId: number;
  grantee: `0x${string}`;
  level: number;
}

export interface CreateCaseInput {
  reportCid: string;
  reportDigest: `0x${string}`;
  category: number;
  evidenceCid?: string;
  evidenceDigest?: `0x${string}`;
}

export interface VoteSubmission {
  caseId: number;
  recommendation: number;
  severityScore: number;
  notes: string;
}

export type UserRole = "admin" | "reviewer" | "reporter" | "guest";
