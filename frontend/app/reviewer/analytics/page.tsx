'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Logo from '@/components/Logo';
import AnimatedCounter from '@/components/AnimatedCounter';
import { getCaseCategoryLabel, getCaseStatusLabel } from '@/lib/contracts';
import { formatTimestamp } from '@/lib/report-utils';
import { useCases } from '@/hooks/useCaseRegistry';
import { useAllCaseIds } from '@/hooks/useCaseRegistry';

function StatusDot({ status }: { status: number }) {
  const colors = ['bg-amber-400', 'bg-purple-400', 'bg-blue-400', 'bg-rose-400', 'bg-emerald-400', 'bg-gray-400', 'bg-red-400'];
  return <span className={`w-2 h-2 rounded-full ${colors[status] || 'bg-gray-400'}`} />;
}

function CategoryBar({ category, count, max, total }: { category: number; count: number; max: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const barWidth = max > 0 ? (count / max) * 100 : 0;
  const colors = ['from-blue-500/20 to-blue-500/5', 'from-rose-500/20 to-rose-500/5', 'from-amber-500/20 to-amber-500/5', 'from-emerald-500/20 to-emerald-500/5', 'from-purple-500/20 to-purple-500/5', 'from-sky-500/20 to-sky-500/5', 'from-gray-500/20 to-gray-500/5'];
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-sm text-gray-400 truncate">{getCaseCategoryLabel(category)}</div>
      <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors[category] || colors[6]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="w-16 text-right text-sm text-white font-medium">{count}</div>
      <div className="w-16 text-right text-xs text-gray-500">{percentage.toFixed(1)}%</div>
    </div>
  );
}

function OutcomeChart({ cases }: { cases: { status: number }[] }) {
  const total = cases.length || 1;
  const submitted = cases.filter(c => c.status === 0).length;
  const underReview = cases.filter(c => c.status === 1).length;
  const escalated = cases.filter(c => c.status === 3).length;
  const verified = cases.filter(c => c.status === 4).length;
  const closed = cases.filter(c => c.status === 5).length;
  const rejected = cases.filter(c => c.status === 6).length;

  const items = [
    { label: 'Submitted', value: submitted, color: 'amber', pct: (submitted / total * 100).toFixed(0) },
    { label: 'Under Review', value: underReview, color: 'purple', pct: (underReview / total * 100).toFixed(0) },
    { label: 'Escalated', value: escalated, color: 'rose', pct: (escalated / total * 100).toFixed(0) },
    { label: 'Verified', value: verified, color: 'emerald', pct: (verified / total * 100).toFixed(0) },
    { label: 'Closed', value: closed, color: 'gray', pct: (closed / total * 100).toFixed(0) },
    { label: 'Rejected', value: rejected, color: 'red', pct: (rejected / total * 100).toFixed(0) },
  ];

  const maxVal = Math.max(...items.map(i => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-4">
          <div className="w-28 text-sm text-gray-400">{item.label}</div>
          <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
            <div
              className={`h-full rounded-lg ${
                item.color === 'amber' ? 'bg-amber-500/60' :
                item.color === 'purple' ? 'bg-purple-500/60' :
                item.color === 'rose' ? 'bg-rose-500/60' :
                item.color === 'emerald' ? 'bg-emerald-500/60' :
                item.color === 'gray' ? 'bg-gray-500/60' :
                'bg-red-500/60'
              }`}
              style={{ width: `${(item.value / maxVal) * 100}%` }}
            />
          </div>
          <div className="w-12 text-right font-medium text-white">{item.value}</div>
          <div className="w-10 text-right text-xs text-gray-500">{item.pct}%</div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { isConnected, address } = useAccount();
  const { caseIds, isLoading: idsLoading } = useAllCaseIds();
  const { cases, isLoading: casesLoading } = useCases(caseIds);

  const categoryCounts: Record<number, number> = {};
  cases.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });
  const sortedCategories = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a);
  const maxCount = sortedCategories[0]?.[1] || 1;

  const total = cases.length;
  const resolved = cases.filter(c => [4, 5, 6].includes(c.status)).length;
  const avgSeverity = total > 0
    ? (cases.reduce((sum, c) => sum + c.averageSeverityScore, 0) / total).toFixed(1)
    : '0.0';
  const avgReviewers = total > 0
    ? (cases.reduce((sum, c) => sum + c.reviewerCount, 0) / total).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-teal-600/10 to-transparent rounded-full blur-[150px]" />
      </div>

      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <ConnectButton />
        </div>
      </nav>

      <main className="relative pt-28 pb-16 px-6 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Consensus</span> Analytics
          </h1>
          <p className="text-gray-400">
            Multi-reviewer consensus patterns, reviewer performance, and case outcome trends.
          </p>
        </div>

        {idsLoading || casesLoading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-gray-400 mt-4">Loading analytics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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
                  <AnimatedCounter end={total} />
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Resolution Rate</div>
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                  {total > 0 ? ((resolved / total) * 100).toFixed(0) : 0}<span className="text-lg">%</span>
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Avg Severity</div>
                </div>
                <div className="text-3xl font-bold text-purple-400">
                  {avgSeverity}
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Avg Reviewers</div>
                </div>
                <div className="text-3xl font-bold text-amber-400">
                  {avgReviewers}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-10">
              <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-6">Case Outcome Distribution</h3>
                <OutcomeChart cases={cases} />
              </div>

              <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-6">Cases by Category</h3>
                <div className="space-y-3">
                  {sortedCategories.length > 0 ? sortedCategories.map(([cat, count]) => (
                    <CategoryBar
                      key={cat}
                      category={Number(cat)}
                      count={count}
                      max={maxCount}
                      total={total}
                    />
                  )) : (
                    <p className="text-gray-400 text-sm">No data available yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-semibold">Recent Cases</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Case</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cases.slice(0, 20).map(item => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/reviewer/case/${item.id}`} className="font-semibold text-white hover:text-purple-400">
                            #{item.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{getCaseCategoryLabel(item.category)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 text-sm text-gray-400">
                            <StatusDot status={item.status} />
                            {getCaseStatusLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {item.voteCount}/{item.reviewerCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{item.averageSeverityScore}/5</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatTimestamp(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
