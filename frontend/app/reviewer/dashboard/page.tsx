'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import AnimatedCounter from '@/components/AnimatedCounter';
import { getCaseCategoryLabel, getCaseStatusLabel } from '@/lib/contracts';
import { fetchJsonFromIPFS } from '@/lib/pinata';
import { formatTimestamp } from '@/lib/report-utils';
import { useCases } from '@/hooks/useCaseRegistry';
import { useAssignedCases } from '@/hooks/useReviewerHub';
import type { ReportPayload } from '@/types';

export default function ReviewerDashboard() {
  const { isConnected, address } = useAccount();
  const { assignedCases, isLoading: assignmentsLoading } = useAssignedCases(address);
  const { cases, isLoading: casesLoading } = useCases(assignedCases);
  const [reports, setReports] = useState<Record<number, ReportPayload | null>>({});

  useEffect(() => {
    let active = true;

    async function loadReports() {
      if (cases.length === 0) {
        setReports({});
        return;
      }

      const entries = await Promise.all(
        cases.map(async (item) => {
          try {
            return [item.id, await fetchJsonFromIPFS<ReportPayload>(item.reportCid)] as const;
          } catch {
            return [item.id, null] as const;
          }
        })
      );

      if (!active) {
        return;
      }

      const nextReports: Record<number, ReportPayload | null> = {};
      for (const [caseId, payload] of entries) {
        nextReports[caseId] = payload;
      }
      setReports(nextReports);
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, [cases]);

  const sortedCases = [...cases].sort((left, right) => right.updatedAt - left.updatedAt);
  const pendingCount = sortedCases.filter((item) => ![4, 5, 6].includes(item.status)).length;
  const completedCount = sortedCases.filter((item) => [4, 5, 6].includes(item.status)).length;
  const escalatedCount = sortedCases.filter((item) => item.status === 3).length;

  return (
    <div className="min-h-screen relative">
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold gradient-text">
            LeakProof X
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Reviewer dashboard</h1>
          <p className="text-gray-400 mt-2">Open assigned cases, inspect payloads, and submit a recommendation.</p>
        </div>

        {!isConnected ? (
          <div className="glass rounded-3xl p-8 border border-white/10 text-center">
            <h2 className="text-2xl font-semibold">Connect your reviewer wallet</h2>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-sm text-gray-500">Assigned</div>
                <div className="text-3xl font-bold text-fuchsia-300 mt-2">
                  {assignmentsLoading ? '...' : <AnimatedCounter end={sortedCases.length} />}
                </div>
              </div>
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-3xl font-bold text-amber-300 mt-2">
                  <AnimatedCounter end={pendingCount} />
                </div>
              </div>
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-sm text-gray-500">Completed</div>
                <div className="text-3xl font-bold text-emerald-300 mt-2">
                  <AnimatedCounter end={completedCount} />
                </div>
              </div>
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-sm text-gray-500">Escalated</div>
                <div className="text-3xl font-bold text-rose-300 mt-2">
                  <AnimatedCounter end={escalatedCount} />
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold mb-6">Assigned cases</h2>

              {assignmentsLoading || casesLoading ? (
                <div className="text-gray-400">Loading assignments...</div>
              ) : sortedCases.length === 0 ? (
                <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-6 text-gray-400">
                  No cases are assigned to this wallet yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCases.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-950/50 border border-white/10 p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold">
                            {reports[item.id]?.title || `Case #${item.id}`}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {getCaseCategoryLabel(item.category)} | {getCaseStatusLabel(item.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                            {reports[item.id]?.description || 'Report payload could not be loaded from IPFS.'}
                          </p>
                          <div className="text-xs text-gray-500 mt-3">Last update {formatTimestamp(item.updatedAt)}</div>
                        </div>

                        <div className="flex flex-col items-start lg:items-end gap-3">
                          <div className="text-sm text-gray-400">Votes: {item.voteCount}</div>
                          <Link
                            href={`/reviewer/case/${item.id}`}
                            className="px-4 py-3 rounded-2xl bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/20 hover:bg-fuchsia-500/25 transition-colors"
                          >
                            Review case
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
