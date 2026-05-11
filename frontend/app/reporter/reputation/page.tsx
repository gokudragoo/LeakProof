'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Logo from '@/components/Logo';
import { useReporterReputation, useReputationActions } from '@/hooks/useReputation';
import { CONTRACTS, isContractConfigured } from '@/lib/contracts';
import { formatTimestamp } from '@/lib/report-utils';

function TrustBadge({ trusted, suspicious }: { trusted: boolean; suspicious: boolean }) {
  if (trusted) {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Trusted Reporter
      </span>
    );
  }
  if (suspicious) {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Under Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-500/10 border border-gray-500/20 text-gray-400">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      New Reporter
    </span>
  );
}

function ReputationMeter({ score }: { score: number }) {
  const maxScore = 1000;
  const percentage = Math.min((score / maxScore) * 100, 100);
  const color = score >= 700 ? 'emerald' : score >= 200 ? 'amber' : 'rose';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Credibility Score</span>
        <span className="text-2xl font-bold gradient-text">{score}</span>
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
            color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
            'bg-gradient-to-r from-rose-500 to-red-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>0 (Suspicious)</span>
        <span>1000 (Trusted)</span>
      </div>
    </div>
  );
}

function OutcomeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full bg-${color}-400`} />
      <span className="text-sm text-gray-400 flex-1">{label}</span>
      <span className={`font-semibold text-${color}-400`}>{value}</span>
    </div>
  );
}

export default function ReputationPage() {
  const { isConnected, address } = useAccount();
  const { profile, isLoading } = useReporterReputation(address);
  const { createCommitment, isPending: commitmentPending } = useReputationActions();

  const [notice, setNotice] = useState('');
  const reputationReady = isContractConfigured(CONTRACTS.REPUTATION);

  const handleCreateCommitment = async () => {
    try {
      await createCommitment();
      setNotice('Anonymous commitment created successfully.');
    } catch {
      setNotice('Failed to create commitment.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[150px]" />
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

      <main className="relative pt-28 pb-16 px-6 max-w-4xl mx-auto">
        <Link href="/reporter/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Reputation</span> Profile
          </h1>
          <p className="text-gray-400">
            Your anonymous credibility history. Builds trust without revealing identity.
          </p>
        </div>

        {!reputationReady ? (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-bold mb-3">Reputation Not Configured</h2>
            <p className="text-gray-400">
              Deploy the Wave 3 reputation contract and set NEXT_PUBLIC_REPUTATION to enable this page.
            </p>
          </div>
        ) : !isConnected ? (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to view your reputation profile.</p>
            <ConnectButton />
          </div>
        ) : isLoading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-gray-400 mt-4">Loading reputation data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {notice && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                {notice}
              </div>
            )}

            <div className="glass-card p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Wallet</div>
                  <div className="font-mono text-white">{address}</div>
                </div>
                <TrustBadge trusted={profile?.isTrusted ?? false} suspicious={profile?.isSuspicious ?? false} />
              </div>

              <ReputationMeter score={profile?.credibilityScore ?? 500} />

              <div className="mt-8 grid grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <div className="text-2xl font-bold gradient-text">{profile?.totalReports ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Reports</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-500/5">
                  <div className="text-2xl font-bold text-emerald-400">{profile?.verifiedReports ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Verified</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-red-500/5">
                  <div className="text-2xl font-bold text-red-400">{profile?.rejectedReports ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Rejected</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-amber-500/5">
                  <div className="text-2xl font-bold text-amber-400">{profile?.escalatedReports ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Escalated</div>
                </div>
              </div>

              {profile?.lastReportAt ? (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="text-sm text-gray-500">Last report submitted</div>
                  <div className="text-white">{formatTimestamp(profile.lastReportAt)}</div>
                </div>
              ) : null}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Anonymous Identity Commitment</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create a cryptographic commitment that proves you are a legitimate reporter without revealing your wallet address.
                This helps build trust across multiple reports.
              </p>
              <button
                onClick={handleCreateCommitment}
                disabled={commitmentPending}
                className="btn-primary flex items-center gap-2"
              >
                {commitmentPending ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Create Identity Commitment
                  </>
                )}
              </button>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">How Reputation Works</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-emerald-400 font-bold">+</span>
                  </div>
                  <span><strong className="text-white">Verified reports</strong> (+30 pts) increase your credibility score.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-emerald-400 font-bold">+</span>
                  </div>
                  <span><strong className="text-white">Escalated reports</strong> (+20 pts) show active participation.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-red-400 font-bold">-</span>
                  </div>
                  <span><strong className="text-white">Rejected reports</strong> (-10 pts) may reduce credibility. Repeat offenders face additional penalties.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-purple-400 font-bold">W</span>
                  </div>
                  <span><strong className="text-white">700+ score</strong> marks you as a Trusted Reporter. Below 200 triggers review.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
