import type { CaseRecord } from "@/types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

function normalizeAddress(value: string | undefined) {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "") ? (value as `0x${string}`) : ZERO_ADDRESS;
}

export const ACCESS_CONTROL_ABI = [
  {
    inputs: [{ internalType: "address", name: "initialAdmin", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "grantAdminRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "grantReviewerRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "grantReporterRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "isAdmin",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "isReviewer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "isReporter",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const CORE_ABI = [
  {
    inputs: [
      { internalType: "string", name: "reportCid", type: "string" },
      { internalType: "bytes32", name: "reportDigest", type: "bytes32" },
      { internalType: "uint8", name: "category", type: "uint8" },
      {
        components: [
          { internalType: "uint256", name: "ctHash", type: "uint256" },
          { internalType: "uint8", name: "securityZone", type: "uint8" },
          { internalType: "uint8", name: "utype", type: "uint8" },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct InEuint8",
        name: "reporterSeverity",
        type: "tuple",
      },
      { internalType: "string", name: "evidenceCid", type: "string" },
      { internalType: "bytes32", name: "evidenceDigest", type: "bytes32" },
    ],
    name: "createCase",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "caseId", type: "uint256" },
      { indexed: true, internalType: "address", name: "reporter", type: "address" },
      { indexed: true, internalType: "uint8", name: "category", type: "uint8" },
      { indexed: false, internalType: "string", name: "reportCid", type: "string" },
      { indexed: false, internalType: "string", name: "evidenceCid", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "CaseCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "caseId", type: "uint256" },
      { indexed: false, internalType: "uint8", name: "oldStatus", type: "uint8" },
      { indexed: false, internalType: "uint8", name: "newStatus", type: "uint8" },
      { indexed: true, internalType: "address", name: "updater", type: "address" },
    ],
    name: "StatusUpdated",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getCase",
    outputs: [
      { internalType: "string", name: "reportCid", type: "string" },
      { internalType: "bytes32", name: "reportDigest", type: "bytes32" },
      { internalType: "uint8", name: "category", type: "uint8" },
      { internalType: "string", name: "evidenceCid", type: "string" },
      { internalType: "bytes32", name: "evidenceDigest", type: "bytes32" },
      { internalType: "address", name: "reporter", type: "address" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint8", name: "status", type: "uint8" },
      { internalType: "uint256", name: "reviewerCount", type: "uint256" },
      { internalType: "uint256", name: "voteCount", type: "uint256" },
      { internalType: "uint256", name: "approvalCount", type: "uint256" },
      { internalType: "uint256", name: "rejectCount", type: "uint256" },
      { internalType: "uint256", name: "escalationCount", type: "uint256" },
      { internalType: "uint8", name: "averageSeverityScore", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getEncryptedReporterSeverity",
    outputs: [{ internalType: "euint8", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "authorizeCaseConfidentialAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getCaseStatus",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getCaseReporter",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getCaseReviewers",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "reporter", type: "address" }],
    name: "getCasesByReporter",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint8", name: "status", type: "uint8" }],
    name: "getCasesByStatus",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllCases",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "caseExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "caseCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "uint8", name: "newStatus", type: "uint8" },
    ],
    name: "updateStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const REVIEWER_HUB_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "caseId", type: "uint256" },
      { indexed: true, internalType: "address", name: "reviewer", type: "address" },
      { indexed: true, internalType: "address", name: "assigner", type: "address" },
    ],
    name: "ReviewerAssigned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "caseId", type: "uint256" },
      { indexed: true, internalType: "address", name: "reviewer", type: "address" },
    ],
    name: "VoteSubmitted",
    type: "event",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "address", name: "reviewer", type: "address" },
    ],
    name: "assignReviewer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      {
        components: [
          { internalType: "uint256", name: "ctHash", type: "uint256" },
          { internalType: "uint8", name: "securityZone", type: "uint8" },
          { internalType: "uint8", name: "utype", type: "uint8" },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct InEuint8",
        name: "recommendationInput",
        type: "tuple",
      },
      { internalType: "uint8", name: "severityScore", type: "uint8" },
      { internalType: "string", name: "encryptedNotes", type: "string" },
    ],
    name: "submitVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getReviewerVoteStates",
    outputs: [
      { internalType: "address[]", name: "reviewers", type: "address[]" },
      { internalType: "bool[]", name: "voted", type: "bool[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getEncryptedVoteSummary",
    outputs: [
      { internalType: "euint32", name: "approvals", type: "bytes32" },
      { internalType: "euint32", name: "rejects", type: "bytes32" },
      { internalType: "euint32", name: "escalations", type: "bytes32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getCurrentAverageSeverity",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getVoteSummary",
    outputs: [
      { internalType: "uint256", name: "approvals", type: "uint256" },
      { internalType: "uint256", name: "rejects", type: "uint256" },
      { internalType: "uint256", name: "escalations", type: "uint256" },
      { internalType: "uint256", name: "votes", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "reviewer", type: "address" }],
    name: "getAssignedCases",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "address", name: "reviewer", type: "address" },
    ],
    name: "isReviewerAssigned",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "getVoteCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "caseId", type: "uint256" }],
    name: "authorizeVoteSummaryAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "uint256", name: "threshold", type: "uint256" },
    ],
    name: "setApprovalThreshold",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "uint32", name: "approvals", type: "uint32" },
      { internalType: "uint32", name: "rejects", type: "uint32" },
      { internalType: "uint32", name: "escalations", type: "uint32" },
      { internalType: "bytes[]", name: "signatures", type: "bytes[]" },
    ],
    name: "publishConsensus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "approvalThreshold",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const DISCLOSURE_CTRL_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "address", name: "grantee", type: "address" },
      { internalType: "uint8", name: "level", type: "uint8" },
    ],
    name: "grantDisclosureAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "address", name: "grantee", type: "address" },
    ],
    name: "revokeDisclosureAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "uint8", name: "level", type: "uint8" },
    ],
    name: "requestDisclosure",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "caseId", type: "uint256" },
      { internalType: "address", name: "grantee", type: "address" },
    ],
    name: "getPermissionLevel",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "caseId", type: "uint256" },
    ],
    name: "canAccessCase",
    outputs: [
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "uint8", name: "", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const CONTRACTS = {
  ACCESS_CONTROL: normalizeAddress(process.env.NEXT_PUBLIC_ACCESS_CONTROL),
  CORE: normalizeAddress(process.env.NEXT_PUBLIC_CORE),
  REVIEWER_HUB: normalizeAddress(process.env.NEXT_PUBLIC_REVIEWER_HUB),
  DISCLOSURE_CTRL: normalizeAddress(process.env.NEXT_PUBLIC_DISCLOSURE_CTRL),
} as const;

export const CASE_STATUS = [
  "Submitted",
  "UnderReview",
  "NeedsEvidence",
  "Escalated",
  "Verified",
  "Closed",
  "Rejected",
] as const;

export const CASE_CATEGORY = [
  "Fraud",
  "Harassment",
  "Corruption",
  "PolicyViolation",
  "FinancialMisconduct",
  "ComplianceBreach",
  "Other",
] as const;

export const PERMISSION_LEVEL = [
  "None",
  "OutcomeOnly",
  "SummaryOnly",
  "FullReport",
  "IdentityReveal",
] as const;

export const REVIEW_RECOMMENDATION = [
  "None",
  "Approve",
  "Reject",
  "Escalate",
] as const;

export function getCaseStatusLabel(status: number) {
  return CASE_STATUS[status] ?? `Unknown(${status})`;
}

export function getCaseCategoryLabel(category: number) {
  return CASE_CATEGORY[category] ?? `Unknown(${category})`;
}

export function getPermissionLevelLabel(level: number) {
  return PERMISSION_LEVEL[level] ?? `Unknown(${level})`;
}

export function getRecommendationLabel(recommendation: number) {
  return REVIEW_RECOMMENDATION[recommendation] ?? `Unknown(${recommendation})`;
}

export function normalizeCaseRecord(caseId: number, data: readonly unknown[]): CaseRecord {
  return {
    id: caseId,
    reportCid: String(data[0] ?? ""),
    reportDigest: String(data[1] ?? "0x0") as `0x${string}`,
    category: Number(data[2] ?? 0),
    evidenceCid: String(data[3] ?? ""),
    evidenceDigest: String(data[4] ?? "0x0") as `0x${string}`,
    reporter: String(data[5] ?? ZERO_ADDRESS) as `0x${string}`,
    createdAt: Number(data[6] ?? 0),
    updatedAt: Number(data[7] ?? 0),
    status: Number(data[8] ?? 0),
    reviewerCount: Number(data[9] ?? 0),
    voteCount: Number(data[10] ?? 0),
    approvalCount: Number(data[11] ?? 0),
    rejectCount: Number(data[12] ?? 0),
    escalationCount: Number(data[13] ?? 0),
    averageSeverityScore: Number(data[14] ?? 0),
  };
}

export function contractsConfigured() {
  return Object.values(CONTRACTS).every((address) => address !== ZERO_ADDRESS);
}
