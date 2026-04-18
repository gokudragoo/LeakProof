'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import AnimatedCounter from '@/components/AnimatedCounter';
import { getCaseCategoryLabel, getCaseStatusLabel } from '@/lib/contracts';
import { formatTimestamp } from '@/lib/report-utils';
import { useCases } from '@/hooks/useCaseRegistry';
import { useAssignedCases } from '@/hooks/useReviewerHub';

function StatusBadge({ status }: { status: number }) {
  const labels = ['Submitted', 'Under Review', 'Needs Evidence', 'Escalated', 'Verified', 'Closed', 'Rejected'];
  const classes = [
    'badge-submitted',
    'badge-review',
    'badge-submitted',
    'badge-escalated',
    'badge-verified',
    'badge-closed',
    'badge-rejected',
  ];

  return (
    <span className={`badge ${classes[status] || 'badge-submitted'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[status] || 'Unknown'}
    </span>
  );
}

function CaseCard({ caseId, status, category, createdAt, updatedAt, voteCount, title, description }: {
  caseId: number;
  status: number;
  category: number;
  createdAt: number;
  updatedAt: number;
  voteCount: number;
  title?: string;
  description?: string;
}) {
  return (
    <Link href={`/reviewer/case/${caseId}`} className="block">
      <div className="case-card h-full group">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-white">#{caseId}</span>
              <StatusBadge status={status} />
            </div>
            <span className="text-xs text-gray-500 px-3 py-1 rounded-full bg-white/5">
              {getCaseCategoryLabel(category)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors">
          {title || `Case #${caseId}`}
        </h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {description || 'No description available'}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{voteCount} votes cast</span>
          </div>
          <span className="text-xs text-gray-500">{formatTimestamp(updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ReviewerDashboard() {
  const { isConnected, address } = useAccount();
  const { assignedCases, isLoading: assignmentsLoading } = useAssignedCases(address);
  const { cases, isLoading: casesLoading } = useCases(assignedCases);

  const sortedCases = [...cases].sort((left, right) => right.updatedAt - left.updatedAt);
  const pendingCount = sortedCases.filter((item) => ![4, 5, 6].includes(item.status)).length;
  const completedCount = sortedCases.filter((item) => [4, 5, 6].includes(item.status)).length;
  const escalatedCount = sortedCases.filter((item) => item.status === 3).length;

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-pink-600/10 to-transparent rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xl">🔒</span>
            </div>
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <ConnectButton />
        </div>
      </nav>

      <main className="relative pt-28 pb-16 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Reviewer</span> Dashboard
          </h1>
          <p className="text-gray-400">
            Review assigned cases, vote on reports, and contribute to the consensus.
          </p>
        </div>

        {!isConnected ? (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your reviewer wallet to access assigned cases.</p>
            <ConnectButton />
          </div>
        ) : assignmentsLoading || casesLoading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-gray-400 mt-4">Loading your assignments...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">No Assigned Cases</h2>
            <p className="text-gray-400">
              You don&apos;t have any cases assigned to you yet. Cases will appear here when an admin assigns them.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Assigned</div>
                </div>
                <div className="text-3xl font-bold gradient-text">
                  <AnimatedCounter end={sortedCases.length} />
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div className="text-3xl font-bold text-amber-400">
                  <AnimatedCounter end={pendingCount} />
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                  <AnimatedCounter end={completedCount} />
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Escalated</div>
                </div>
                <div className="text-3xl font-bold text-rose-400">
                  <AnimatedCounter end={escalatedCount} />
                </div>
              </div>
            </div>

            {/* Cases Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCases.map((item) => (
                <CaseCard
                  key={item.id}
                  caseId={item.id}
                  status={item.status}
                  category={item.category}
                  createdAt={item.createdAt}
                  updatedAt={item.updatedAt}
                  voteCount={item.voteCount}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
