import {
  getCaseCategoryLabel,
  getCaseStatusLabel,
} from '@/lib/contracts';
import type { CaseRecord } from '@/types';

export type ComplianceExportPack = {
  schema: 'leakproof-compliance-pack/v1';
  generatedAt: string;
  chainId: number;
  cases: Array<{
    caseId: number;
    category: string;
    status: string;
    reporter: `0x${string}`;
    createdAt: number;
    updatedAt: number;
    reportCid: string;
    reportDigest: `0x${string}`;
    evidenceCid: string;
    evidenceDigest: `0x${string}`;
    reviewerCount: number;
    voteCount: number;
    approvalCount: number;
    rejectCount: number;
    escalationCount: number;
    averageSeverityScore: number;
    redactionPolicy: string;
  }>;
};

export function createComplianceExportPack(cases: CaseRecord[], chainId: number): ComplianceExportPack {
  return {
    schema: 'leakproof-compliance-pack/v1',
    generatedAt: new Date().toISOString(),
    chainId,
    cases: cases.map((caseItem) => ({
      caseId: caseItem.id,
      category: getCaseCategoryLabel(caseItem.category),
      status: getCaseStatusLabel(caseItem.status),
      reporter: caseItem.reporter,
      createdAt: caseItem.createdAt,
      updatedAt: caseItem.updatedAt,
      reportCid: caseItem.reportCid,
      reportDigest: caseItem.reportDigest,
      evidenceCid: caseItem.evidenceCid,
      evidenceDigest: caseItem.evidenceDigest,
      reviewerCount: caseItem.reviewerCount,
      voteCount: caseItem.voteCount,
      approvalCount: caseItem.approvalCount,
      rejectCount: caseItem.rejectCount,
      escalationCount: caseItem.escalationCount,
      averageSeverityScore: caseItem.averageSeverityScore,
      redactionPolicy:
        'Plaintext report body, evidence body, reviewer notes, and identity disclosures are excluded.',
    })),
  };
}

export function downloadComplianceExport(pack: ComplianceExportPack) {
  if (typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([JSON.stringify(pack, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leakproof-compliance-${pack.chainId}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

