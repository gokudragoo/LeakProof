export interface Case {
  id: number;
  encryptedTitle: string;
  encryptedDescription: string;
  encryptedSeverity: number;
  category: number;
  evidenceCID: string;
  reporter: string;
  createdAt: number;
  updatedAt: number;
  status: number;
}

export interface ReviewerAssignment {
  reviewer: string;
  caseId: number;
  hasVoted: boolean;
  encryptedVote: string;
  encryptedScore: string;
  encryptedNotes: string;
  timestamp: number;
}

export interface DisclosurePermission {
  grantee: string;
  caseId: number;
  level: number;
  used: boolean;
  grantedAt: number;
  expiresAt: number;
}

export type CaseStatus =
  | 'Submitted'
  | 'UnderReview'
  | 'NeedsEvidence'
  | 'Escalated'
  | 'Verified'
  | 'Closed'
  | 'Rejected';

export type CaseCategory =
  | 'Fraud'
  | 'Harassment'
  | 'Corruption'
  | 'PolicyViolation'
  | 'FinancialMisconduct'
  | 'ComplianceBreach'
  | 'Other';

export type PermissionLevel =
  | 'None'
  | 'OutcomeOnly'
  | 'SummaryOnly'
  | 'FullReport'
  | 'IdentityReveal';

export type UserRole = 'admin' | 'reviewer' | 'reporter' | 'guest';

export interface EncryptedReport {
  title: string;
  description: string;
  severity: number;
  category: number;
  evidenceCID: string;
}

export interface VoteSubmission {
  caseId: number;
  encryptedVote: string;
  encryptedScore: string;
  encryptedNotes: string;
}