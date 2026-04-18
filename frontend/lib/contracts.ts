export const ACCESS_CONTROL_ABI = [
  {
    inputs: [{ internalType: "address", name: "initialAdmin", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "role", type: "bytes32" },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "role", type: "bytes32" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "hasRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
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
] as const;

export const CORE_ABI = [
  {
    inputs: [
      { internalType: "bytes", name: "_encryptedTitle", type: "bytes" },
      { internalType: "bytes", name: "_encryptedDescription", type: "bytes" },
      { internalType: "uint8", name: "_encryptedSeverity", type: "uint8" },
      { internalType: "uint8", name: "_category", type: "uint8" },
      { internalType: "bytes32", name: "_evidenceCID", type: "bytes32" },
    ],
    name: "createCase",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_caseId", type: "uint256" }],
    name: "getCase",
    outputs: [
      { internalType: "bytes", name: "", type: "bytes" },
      { internalType: "bytes", name: "", type: "bytes" },
      { internalType: "uint8", name: "", type: "uint8" },
      { internalType: "uint8", name: "", type: "uint8" },
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint8", name: "", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_caseId", type: "uint256" }],
    name: "getCaseStatus",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
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
    inputs: [{ internalType: "uint256", name: "_caseId", type: "uint256" }],
    name: "getCaseReviewers",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
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
] as const;

export const REVIEWER_HUB_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_caseId", type: "uint256" },
      { internalType: "address", name: "_reviewer", type: "address" },
    ],
    name: "assignReviewer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_caseId", type: "uint256" },
      { internalType: "bytes", name: "_encryptedVote", type: "bytes" },
      { internalType: "bytes", name: "_encryptedScore", type: "bytes" },
      { internalType: "bytes", name: "_encryptedNotes", type: "bytes" },
    ],
    name: "submitVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_caseId", type: "uint256" }],
    name: "getReviewerVotes",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" },
      { internalType: "bool[]", name: "", type: "bool[]" },
      { internalType: "bytes[]", name: "", type: "bytes[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_reviewer", type: "address" }],
    name: "getAssignedCases",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_caseId", type: "uint256" },
      { internalType: "address", name: "_reviewer", type: "address" },
    ],
    name: "isReviewerAssigned",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_caseId", type: "uint256" }],
    name: "getVoteCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const DISCLOSURE_CTRL_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_caseId", type: "uint256" },
      { internalType: "address", name: "_grantee", type: "address" },
      { internalType: "uint8", name: "_level", type: "uint8" },
    ],
    name: "grantDisclosureAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_caseId", type: "uint256" },
      { internalType: "address", name: "_grantee", type: "address" },
    ],
    name: "getPermissionLevel",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_caseId", type: "uint256" },
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
  ACCESS_CONTROL: process.env.NEXT_PUBLIC_ACCESS_CONTROL || '0xcce613271DCBac6aF3CF4eBf53E4C992d6D8ef69',
  CORE: process.env.NEXT_PUBLIC_CORE || '0x857dfb28574F58a67e7334a33EA7a00263Df9797',
  REVIEWER_HUB: process.env.NEXT_PUBLIC_REVIEWER_HUB || '0x9D0c1dbbAF2E4849c27B88f8E8DA165D764ffB1b',
  DISCLOSURE_CTRL: process.env.NEXT_PUBLIC_DISCLOSURE_CTRL || '0xB2078Aae5782788CA551A8212E27901233260E23',
} as const;

export const CASE_STATUS = {
  0: 'Submitted',
  1: 'UnderReview',
  2: 'NeedsEvidence',
  3: 'Escalated',
  4: 'Verified',
  5: 'Closed',
  6: 'Rejected',
} as const;

export const CASE_CATEGORY = {
  0: 'Fraud',
  1: 'Harassment',
  2: 'Corruption',
  3: 'PolicyViolation',
  4: 'FinancialMisconduct',
  5: 'ComplianceBreach',
  6: 'Other',
} as const;

export const PERMISSION_LEVEL = {
  0: 'None',
  1: 'OutcomeOnly',
  2: 'SummaryOnly',
  3: 'FullReport',
  4: 'IdentityReveal',
} as const;