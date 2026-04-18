'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import AnimatedCounter from '@/components/AnimatedCounter';
import { getCaseCategoryLabel, getCaseStatusLabel } from '@/lib/contracts';
import { fetchJsonFromIPFS } from '@/lib/pinata';
import { formatTimestamp, shortAddress } from '@/lib/report-utils';
import { useCases, useReporterCases } from '@/hooks/useCaseRegistry';
import type { ReportPayload } from '@/types';

export default function ReporterDashboard() {
  const { isConnected, address } = useAccount();
  const { caseIds, isLoading: idsLoading } = useReporterCases(address);
  const { cases, isLoading: casesLoading } = useCases(caseIds);
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
            const payload = await fetchJsonFromIPFS<ReportPayload>(item.reportCid);
            return [item.id, payload] as const;
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

  const sortedCases = [...cases].sort((left, right) => right.createdAt - left.createdAt);
  const openCount = sortedCases.filter((item) => ![4, 5, 6].includes(item.status)).length;
  const resolvedCount = sortedCases.filter((item) => [4, 5, 6].includes(item.status)).length;

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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold">Reporter dashboard</h1>
            <p className="text-gray-400 mt-2">Track the cases created by your connected address.</p>
          </div>
          <Link href="/reporter/submit" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold">
            New report
          </Link>
        </div>

        {!isConnected ? (
          <div className="glass rounded-3xl p-8 border border-white/10 text-center">
            <h2 className="text-2xl font-semibold">Connect your wallet to load your cases</h2>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-500">My cases</div>
                <div className="text-4xl font-bold text-sky-300 mt-2">
                  {idsLoading ? '...' : <AnimatedCounter end={sortedCases.length} />}
                </div>
              </div>
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-500">Open cases</div>
                <div className="text-4xl font-bold text-amber-300 mt-2">
                  <AnimatedCounter end={openCount} />
                </div>
              </div>
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="text-sm text-gray-500">Resolved cases</div>
                <div className="text-4xl font-bold text-emerald-300 mt-2">
                  <AnimatedCounter end={resolvedCount} />
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">My reports</h2>
                  <p className="text-sm text-gray-500 mt-1">Connected as {shortAddress(address)}</p>
                </div>
              </div>

              {idsLoading || casesLoading ? (
                <div className="text-gray-400">Loading your cases...</div>
              ) : sortedCases.length === 0 ? (
                <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-6 text-gray-400">
                  No reports from this wallet yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCases.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-950/50 border border-white/10 p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="text-lg font-semibold">
                            {reports[item.id]?.title || `Case #${item.id}`}
                          </div>
                          <div className="text-sm text-gray-400">
                            {getCaseCategoryLabel(item.category)} | {getCaseStatusLabel(item.status)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created {formatTimestamp(item.createdAt)}
                          </div>
                          <p className="text-sm text-gray-400 max-w-3xl">
                            {reports[item.id]?.description || 'Unable to load the report payload from IPFS.'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-400 space-y-2 min-w-[180px]">
                          <div>Votes: {item.voteCount}</div>
                          <div>Reviewers: {item.reviewerCount}</div>
                          <div>Average severity: {item.averageSeverityScore || 'Pending'}</div>
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
