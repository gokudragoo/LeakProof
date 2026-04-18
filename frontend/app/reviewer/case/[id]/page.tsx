'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Logo from '@/components/Logo';
import {
  getCaseCategoryLabel,
  getCaseStatusLabel,
  getRecommendationLabel,
} from '@/lib/contracts';
import { fetchJsonFromIPFS, getIpfsUrl } from '@/lib/pinata';
import { formatTimestamp } from '@/lib/report-utils';
import { useCase, useEncryptedReporterSeverity } from '@/hooks/useCaseRegistry';
import { useCofheClient } from '@/hooks/useCofheClient';
import {
  useEncryptedVoteSummary,
  useIsReviewerAssigned,
  useReviewerVoteStates,
  useSubmitVote,
  useVoteSummary,
} from '@/hooks/useReviewerHub';
import type { ConfidentialVoteSummary, ReportPayload } from '@/types';

const recommendationOptions = [
  { label: 'Approve', value: 1, color: 'emerald' },
  { label: 'Reject', value: 2, color: 'rose' },
  { label: 'Escalate', value: 3, color: 'amber' },
] as const;

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

export default function ReviewerCaseDetail({ params }: { params: { id: string } }) {
  const caseId = Number(params.id);
  const { isConnected, address } = useAccount();
  const { caseData, isLoading: caseLoading, refetch: refetchCase } = useCase(caseId);
  const { encryptedSeverity, refetch: refetchEncryptedSeverity } = useEncryptedReporterSeverity(caseId);
  const { isAssigned, isLoading: assignmentLoading, refetch: refetchAssignment } = useIsReviewerAssigned(caseId, address);
  const { votes, refetch: refetchVotes } = useReviewerVoteStates(caseId);
  const { handles: encryptedSummaryHandles, refetch: refetchEncryptedSummary } = useEncryptedVoteSummary(caseId);
  const { summary, refetch: refetchSummary } = useVoteSummary(caseId);
  const { submitVote, isPending } = useSubmitVote();
  const { decryptHandle, encryptUint8, isReady: cofheReady } = useCofheClient();

  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [confidentialSummary, setConfidentialSummary] = useState<ConfidentialVoteSummary | null>(null);
  const [reporterSeverity, setReporterSeverity] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState(1);
  const [severityScore, setSeverityScore] = useState(3);
  const [notes, setNotes] = useState('');
  const [statusLine, setStatusLine] = useState('');
  const [error, setError] = useState('');

  // Load payload
  if (caseData?.reportCid && !payload) {
    fetchJsonFromIPFS<ReportPayload>(caseData.reportCid).then(setPayload).catch(() => {});
  }

  const myVote = votes.find((item) => item.reviewer.toLowerCase() === address?.toLowerCase());

  const handleSubmitVote = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      setStatusLine('Encrypting confidential recommendation with CoFHE...');
      const encryptedRecommendation = await encryptUint8(recommendation);

      setStatusLine('Submitting vote on-chain...');
      await submitVote({
        caseId,
        recommendation: encryptedRecommendation,
        severityScore,
        notes: notes.trim(),
      });

      await Promise.all([
        refetchVotes(),
        refetchSummary(),
        refetchCase(),
        refetchAssignment(),
        refetchEncryptedSeverity(),
        refetchEncryptedSummary(),
      ]);
      setStatusLine('Vote confirmed on-chain.');
    } catch (submissionError) {
      setStatusLine('');
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit the vote.');
    }
  };

  if (!Number.isFinite(caseId) || caseId <= 0) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center px-6">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Invalid Case ID</h2>
          <p className="text-gray-400">The case ID provided is not valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-pink-600/10 to-transparent rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/reviewer/dashboard" className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <ConnectButton />
        </div>
      </nav>

      <main className="relative pt-28 pb-16 px-6 max-w-7xl mx-auto">
        {/* Back Link */}
        <Link href="/reviewer/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Case <span className="gradient-text">#{caseId}</span>
          </h1>
          <p className="text-gray-400">
            Review the case details and submit your confidential vote.
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
            <p className="text-gray-400 mb-8">Connect your assigned reviewer wallet to review this case.</p>
            <ConnectButton />
          </div>
        ) : assignmentLoading || caseLoading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-gray-400 mt-4">Loading case details...</p>
          </div>
        ) : !isAssigned || !caseData ? (
          <div className="glass-card p-12 text-center border-red-500/20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Access Denied</h2>
            <p className="text-gray-400">This wallet is not assigned to review case #{caseId}.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8">
            {/* Left Column - Case Details */}
            <div className="space-y-6">
              {/* Case Info */}
              <div className="glass-card p-6">
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="badge badge-submitted">
                    {getCaseCategoryLabel(caseData.category)}
                  </span>
                  <StatusBadge status={caseData.status} />
                </div>

                <h2 className="text-2xl font-bold mb-4">
                  {payload?.title || 'Report Unavailable'}
                </h2>
                <p className="text-gray-400 whitespace-pre-wrap mb-6">
                  {payload?.description || 'The report body could not be loaded from IPFS.'}
                </p>

                <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Created</div>
                    <div className="text-sm text-white">{formatTimestamp(caseData.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                    <div className="text-sm text-white">{formatTimestamp(caseData.updatedAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Reporter</div>
                    <div className="text-sm text-white font-mono">{caseData.reporter}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Reported Severity</div>
                    <div className="text-sm text-white">{reporterSeverity ?? 'Encrypted'}</div>
                  </div>
                </div>

                {caseData.evidenceCid && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <a
                      href={getIpfsUrl(caseData.evidenceCid)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sky-300 hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Evidence File
                    </a>
                  </div>
                )}
              </div>

              {/* Vote Tally */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-6">Current Vote Tally</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-3xl font-bold text-emerald-400">
                      {confidentialSummary?.approvals ?? summary.approvals}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Approvals</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <div className="text-3xl font-bold text-rose-400">
                      {confidentialSummary?.rejects ?? summary.rejects}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Rejects</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-3xl font-bold text-amber-400">
                      {confidentialSummary?.escalations ?? summary.escalations}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Escalations</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                    <div className="text-3xl font-bold text-purple-400">{summary.votes}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Votes</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Vote counts are decrypted confidentially using your access permit.
                </p>
              </div>
            </div>

            {/* Right Column - Voting */}
            <div className="glass-card p-6 h-fit">
              <h3 className="text-xl font-semibold mb-6">Submit Your Vote</h3>

              {myVote?.hasVoted ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold mb-2 text-emerald-400">Vote Recorded</h4>
                  <p className="text-gray-400 text-sm">
                    Your confidential vote for case #{caseId} has been recorded on-chain.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitVote} className="space-y-6">
                  {/* Recommendation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Recommendation</label>
                    <div className="grid grid-cols-3 gap-3">
                      {recommendationOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRecommendation(option.value)}
                          className={`py-4 rounded-xl font-semibold transition-all ${recommendation === option.value ? option.color === 'emerald' ? 'bg-emerald-500 text-white' : option.color === 'rose' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white' : 'bg-white/5 border border-white/10'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Severity Score</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSeverityScore(value)}
                          className={`w-12 h-12 rounded-xl font-semibold transition-all ${severityScore === value ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-white/5 border border-white/10'}`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Add your reviewer notes..."
                      className="input-modern min-h-[120px] resize-none"
                    />
                  </div>

                  {/* Status */}
                  {statusLine && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      {statusLine}
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isPending || !cofheReady}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Waiting for wallet...
                      </>
                    ) : !cofheReady ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Connecting encrypted client...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Submit Confidential Vote
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
