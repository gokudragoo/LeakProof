'use client';

import Link from 'next/link';

export default function CaseCard({ caseId, status, category }: { caseId: number; status: string; category: string }) {
  const statusColors: Record<string, string> = {
    Submitted: 'bg-blue-500/20 text-blue-400',
    UnderReview: 'bg-purple-500/20 text-purple-400',
    Escalated: 'bg-amber-500/20 text-amber-400',
    Verified: 'bg-emerald-500/20 text-emerald-400',
    Closed: 'bg-gray-500/20 text-gray-400',
    Rejected: 'bg-red-500/20 text-red-400',
    NeedsEvidence: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <Link
      href={`/cases/${caseId}`}
      className="block p-6 rounded-xl bg-dark-700/50 border border-gray-700 hover:border-primary-500/50 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-semibold text-lg group-hover:text-primary-400 transition-colors">
            Case #{caseId}
          </div>
          <div className="text-sm text-gray-400">{category}</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-500/20 text-gray-400'}`}>
          {status}
        </span>
      </div>

      <div className="flex gap-4 text-sm text-gray-500">
        <span>Encrypted Content</span>
        <span>•</span>
        <span>On-Chain</span>
      </div>
    </Link>
  );
}