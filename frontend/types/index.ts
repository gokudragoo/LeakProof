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
  category: number;
  createdAt: string;
  reporterAddress: string;
  evidenceName?: string;
}

export interface VoteRecord {
  reviewer: `0x${string}`;
  hasVoted: boolean;
}

export interface VoteSummary {
  approvals: number;
  rejects: number;
  escalations: number;
  votes: number;
}

export interface ConfidentialVoteSummary {
  approvals: number;
  rejects: number;
  escalations: number;
  averageSeverityScore: number;
}

export interface DisclosurePermission {
  caseId: number;
  grantee: `0x${string}`;
  level: number;
}

export interface EncryptedUint8Input {
  ctHash: bigint;
  securityZone: number;
  utype: number;
  signature: `0x${string}`;
}

export interface EncryptedHandle {
  ctHash: `0x${string}`;
  utype: number;
}

export interface CreateCaseInput {
  reportCid: string;
  reportDigest: `0x${string}`;
  category: number;
  reporterSeverity: EncryptedUint8Input;
  evidenceCid?: string;
  evidenceDigest?: `0x${string}`;
}

export interface VoteSubmission {
  caseId: number;
  recommendation: EncryptedUint8Input;
  severityScore: EncryptedUint8Input;
  notes: string;
}

export type UserRole = "admin" | "reviewer" | "reporter" | "guest";
