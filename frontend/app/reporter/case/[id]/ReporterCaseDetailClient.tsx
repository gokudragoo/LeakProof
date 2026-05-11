'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Logo from '@/components/Logo';
import { getCaseCategoryLabel } from '@/lib/contracts';
import { fetchJsonFromIPFS, getIpfsUrl } from '@/lib/pinata';
import { formatTimestamp } from '@/lib/report-utils';
import { useCase } from '@/hooks/useCaseRegistry';
import type { ReportPayload } from '@/types';

function StatusBadge({ status }: { status: number }) {
  const labels = ['Submitted', 'Under Review', 'Needs Evidence', 'Escalated', 'Verified', 'Closed', 'Rejected'];
  const classes = ['badge-submitted', 'badge-review', 'badge-submitted', 'badge-escalated', 'badge-verified', 'badge-closed', 'badge-rejected'];
  return (
    <span className={`badge ${classes[status] || 'badge-submitted'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[status] || 'Unknown'}
    </span>
  );
}

export default function ReporterCaseDetailClient({ caseId }: { caseId: number }) {
  const { isConnected, address } = useAccount();
  const { caseData, isLoading } = useCase(caseId);
  const [payload, setPayload] = useState<ReportPayload | null>(null);

  useEffect(() => {
    let active = true;

    if (!caseData?.reportCid) {
      setPayload(null);
      return;
    }

    fetchJsonFromIPFS<ReportPayload>(caseData.reportCid)
      .then((nextPayload) => {
        if (active) setPayload(nextPayload);
      })
      .catch(() => {
        if (active) setPayload(null);
      });

    return () => {
      active = false;
    };
  }, [caseData?.reportCid]);

  if (!Number.isFinite(caseId) || caseId <= 0) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center px-6">
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid Case ID</h2>
          <p className="text-gray-400">The case ID provided is not valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[150px]" />
      </div>

      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/reporter/dashboard" className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <ConnectButton />
        </div>
      </nav>

      <main className="relative pt-28 pb-16 px-6 max-w-4xl mx-auto">
        <Link href="/reporter/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Case <span className="gradient-text">#{caseId}</span>
          </h1>
          <p className="text-gray-400">
            Track the status of your confidential report.
          </p>
        </div>

        {!isConnected ? (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to view your case details.</p>
            <ConnectButton />
          </div>
        ) : isLoading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-gray-400 mt-4">Loading case details...</p>
          </div>
        ) : !caseData ? (
          <div className="glass-card p-12 text-center border-red-500/20">
            <h2 className="text-2xl font-bold mb-3">Case Not Found</h2>
            <p className="text-gray-400">This case does not exist or you do not have access.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex flex-wrap gap-3 mb-6">
                <StatusBadge status={caseData.status} />
                <span className="badge badge-submitted">{getCaseCategoryLabel(caseData.category)}</span>
              </div>

              <h2 className="text-2xl font-bold mb-3">
                {payload?.title || `Case #${caseId}`}
              </h2>
              <p className="text-sm text-gray-400 whitespace-pre-wrap mb-6">
                {payload?.description || 'Report payload is still private or unavailable from IPFS.'}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Submitted</div>
                  <div className="text-sm text-white">{formatTimestamp(caseData.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                  <div className="text-sm text-white">{formatTimestamp(caseData.updatedAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Assigned Reviewers</div>
                  <div className="text-sm text-white">{caseData.reviewerCount}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Votes Cast</div>
                  <div className="text-sm text-white">{caseData.voteCount} / {caseData.reviewerCount}</div>
                </div>
              </div>

              {caseData.averageSeverityScore > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-gray-500 mb-2">Average Severity Score</div>
                  <div className="text-2xl font-bold gradient-text">{caseData.averageSeverityScore}/5</div>
                </div>
              )}

              {caseData.evidenceCid && (
                <div className="mb-6 pt-6 border-t border-white/5">
                  <div className="text-xs text-gray-500 mb-2">Evidence File</div>
                  <a
                    href={getIpfsUrl(caseData.evidenceCid)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sky-300 hover:bg-white/10"
                  >
                    View Evidence
                  </a>
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Case Timeline</h3>
              <div className="space-y-4">
                {[
                  { label: 'Case Submitted', done: true, time: caseData.createdAt },
                  { label: 'Under Review', done: caseData.status >= 1, time: caseData.status >= 1 ? caseData.updatedAt : undefined },
                  { label: 'Needs Evidence', done: caseData.status >= 2, time: undefined },
                  { label: 'Escalated', done: caseData.status >= 3, time: undefined },
                  { label: 'Verified / Rejected', done: caseData.status >= 4, time: undefined },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'
                    }`}>
                      {step.done ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${step.done ? 'text-white' : 'text-gray-500'}`}>{step.label}</div>
                      {step.time ? <div className="text-xs text-gray-500">{formatTimestamp(step.time)}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Disclosure Policy</h3>
              <p className="text-sm text-gray-400">
                Your report is encrypted and stored securely. Identity reveal is only possible through multi-admin approval or time-locked disclosure. Your wallet address serves as your pseudonymous identifier.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
