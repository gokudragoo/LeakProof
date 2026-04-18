'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import AnimatedCounter from '@/components/AnimatedCounter';
import Logo from '@/components/Logo';
import { getCaseCategoryLabel, getCaseStatusLabel } from '@/lib/contracts';
import { formatTimestamp, shortAddress } from '@/lib/report-utils';
import { useCases, useReporterCases } from '@/hooks/useCaseRegistry';
import type { ReportPayload } from '@/types';

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

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
        <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold mb-3">No Reports Yet</h3>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        You haven&apos;t submitted any reports yet. Start by submitting your first report.
      </p>
      <Link href="/reporter/submit" className="btn-primary inline-flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        Submit First Report
      </Link>
    </div>
  );
}

function CaseCard({ caseId, status, category, reporter, createdAt, voteCount, reviewerCount, title, description }: {
  caseId: number;
  status: number;
  category: number;
  reporter: string;
  createdAt: number;
  voteCount: number;
  reviewerCount: number;
  title?: string;
  description?: string;
}) {
  return (
    <Link href={`/reviewer/case/${caseId}`} className="block">
      <div className="case-card h-full">
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
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">{formatTimestamp(createdAt)}</div>
            <div className="text-xs text-gray-500">{shortAddress(reporter)}</div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2 line-clamp-1">
          {title || `Case #${caseId}`}
        </h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {description || 'No description available'}
        </p>

        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{voteCount} votes</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{reviewerCount} reviewers</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ReporterDashboard() {
  const { isConnected, address } = useAccount();
  const { caseIds, isLoading: idsLoading } = useReporterCases(address);
  const { cases, isLoading: casesLoading } = useCases(caseIds);
  const [reports, setReports] = React.useState<Record<number, ReportPayload | null>>({});

  const sortedCases = [...cases].sort((left, right) => right.createdAt - left.createdAt);
  const openCount = sortedCases.filter((item) => ![4, 5, 6].includes(item.status)).length;
  const resolvedCount = sortedCases.filter((item) => [4, 5, 6].includes(item.status)).length;

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[150px]" />
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
          <div className="flex items-center gap-4">
            <Link href="/reporter/submit" className="btn-primary hidden sm:flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              New Report
            </Link>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <main className="relative pt-28 pb-16 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Reporter</span> Dashboard
          </h1>
          <p className="text-gray-400">
            Track and manage your submitted reports. {address && `Connected as ${shortAddress(address)}`}
          </p>
        </div>

        {!isConnected ? (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to view and manage your reports.</p>
            <ConnectButton />
          </div>
        ) : idsLoading || casesLoading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-gray-400 mt-4">Loading your cases...</p>
          </div>
        ) : cases.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Total Cases</div>
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
                  <div className="text-sm text-gray-500">Open Cases</div>
                </div>
                <div className="text-3xl font-bold text-amber-400">
                  <AnimatedCounter end={openCount} />
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Resolved</div>
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                  <AnimatedCounter end={resolvedCount} />
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
                  reporter={item.reporter}
                  createdAt={item.createdAt}
                  voteCount={item.voteCount}
                  reviewerCount={item.reviewerCount}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
