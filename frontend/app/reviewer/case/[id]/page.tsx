'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import {
  getCaseCategoryLabel,
  getCaseStatusLabel,
  getRecommendationLabel,
} from '@/lib/contracts';
import { fetchJsonFromIPFS, getIpfsUrl } from '@/lib/pinata';
import { formatTimestamp } from '@/lib/report-utils';
import { useCase } from '@/hooks/useCaseRegistry';
import {
  useIsReviewerAssigned,
  useReviewerVotes,
  useSubmitVote,
  useVoteSummary,
} from '@/hooks/useReviewerHub';
import type { ReportPayload } from '@/types';

const recommendationOptions = [
  { label: 'Approve', value: 1, tone: 'emerald' },
  { label: 'Reject', value: 2, tone: 'rose' },
  { label: 'Escalate', value: 3, tone: 'amber' },
] as const;

export default function ReviewerCaseDetail({ params }: { params: { id: string } }) {
  const caseId = Number(params.id);
  const { isConnected, address } = useAccount();
  const { caseData, isLoading: caseLoading, refetch: refetchCase } = useCase(caseId);
  const { isAssigned, isLoading: assignmentLoading, refetch: refetchAssignment } = useIsReviewerAssigned(caseId, address);
  const { votes, refetch: refetchVotes } = useReviewerVotes(caseId);
  const { summary, refetch: refetchSummary } = useVoteSummary(caseId);
  const { submitVote, isPending } = useSubmitVote();

  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [recommendation, setRecommendation] = useState(1);
  const [severityScore, setSeverityScore] = useState(3);
  const [notes, setNotes] = useState('');
  const [statusLine, setStatusLine] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPayload() {
      if (!caseData?.reportCid) {
        setPayload(null);
        return;
      }

      try {
        const report = await fetchJsonFromIPFS<ReportPayload>(caseData.reportCid);
        if (active) {
          setPayload(report);
        }
      } catch {
        if (active) {
          setPayload(null);
        }
      }
    }

    void loadPayload();

    return () => {
      active = false;
    };
  }, [caseData?.reportCid]);

  const myVote = votes.find((item) => item.reviewer.toLowerCase() === address?.toLowerCase());

  const handleSubmitVote = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      setStatusLine('Submitting vote on-chain...');
      await submitVote({
        caseId,
        recommendation,
        severityScore,
        notes: notes.trim(),
      });

      await Promise.all([refetchVotes(), refetchSummary(), refetchCase(), refetchAssignment()]);
      setStatusLine('Vote confirmed on-chain.');
    } catch (submissionError) {
      setStatusLine('');
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit the vote.');
    }
  };

  if (!Number.isFinite(caseId) || caseId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="glass rounded-3xl p-8 border border-white/10">
          Invalid case ID.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/reviewer/dashboard" className="text-xl font-bold gradient-text">
            LeakProof X
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 relative z-10">
        <Link href="/reviewer/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
          Back to reviewer dashboard
        </Link>

        <div className="mt-4 mb-8">
          <h1 className="text-4xl font-bold">Case #{caseId}</h1>
          <p className="text-gray-400 mt-2">Inspect the case payload and submit one recommendation.</p>
        </div>

        {!isConnected ? (
          <div className="glass rounded-3xl p-8 border border-white/10 text-center">
            Connect the assigned reviewer wallet to continue.
          </div>
        ) : assignmentLoading || caseLoading ? (
          <div className="glass rounded-3xl p-8 border border-white/10 text-gray-400">
            Loading case details...
          </div>
        ) : !isAssigned || !caseData ? (
          <div className="glass rounded-3xl p-8 border border-red-500/20 bg-red-500/10 text-red-300">
            This wallet is not assigned to review case #{caseId}.
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="space-y-6">
              <div className="glass rounded-3xl p-6 border border-white/10">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="px-3 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300">
                    {getCaseCategoryLabel(caseData.category)}
                  </span>
                  <span className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300">
                    {getCaseStatusLabel(caseData.status)}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold mt-5">
                  {payload?.title || 'Report payload unavailable'}
                </h2>
                <p className="text-gray-400 mt-4 whitespace-pre-wrap">
                  {payload?.description || 'The report body could not be loaded from IPFS.'}
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm text-gray-400">
                  <div>Created: {formatTimestamp(caseData.createdAt)}</div>
                  <div>Updated: {formatTimestamp(caseData.updatedAt)}</div>
                  <div>Reporter: {caseData.reporter}</div>
                  <div>
                    Severity: {payload?.severity ?? (caseData.averageSeverityScore || 'Pending')}
                  </div>
                </div>

                {caseData.evidenceCid ? (
                  <div className="mt-6">
                    <a
                      href={getIpfsUrl(caseData.evidenceCid)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sky-300 hover:bg-white/10"
                    >
                      Open evidence file
                    </a>
                  </div>
                ) : null}
              </div>

              <div className="glass rounded-3xl p-6 border border-white/10">
                <h2 className="text-2xl font-semibold">Current tally</h2>
                <div className="grid sm:grid-cols-4 gap-4 mt-5 text-sm">
                  <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-4">
                    <div className="text-gray-500">Approvals</div>
                    <div className="text-2xl font-bold text-emerald-300 mt-2">{summary.approvals}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-4">
                    <div className="text-gray-500">Rejects</div>
                    <div className="text-2xl font-bold text-rose-300 mt-2">{summary.rejects}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-4">
                    <div className="text-gray-500">Escalations</div>
                    <div className="text-2xl font-bold text-amber-300 mt-2">{summary.escalations}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-4">
                    <div className="text-gray-500">Total votes</div>
                    <div className="text-2xl font-bold text-sky-300 mt-2">{summary.votes}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold">Submit your vote</h2>
              {myVote?.hasVoted ? (
                <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-sm text-emerald-200">
                  Vote already recorded: {getRecommendationLabel(myVote.recommendation)} with severity {myVote.severityScore}.
                </div>
              ) : (
                <form onSubmit={handleSubmitVote} className="space-y-5 mt-5">
                  <div>
                    <label className="block text-sm text-gray-400 mb-3">Recommendation</label>
                    <div className="grid grid-cols-3 gap-3">
                      {recommendationOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRecommendation(option.value)}
                          className={`px-3 py-4 rounded-2xl border transition-colors ${recommendation === option.value ? option.tone === 'emerald' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : option.tone === 'rose' ? 'border-rose-500 bg-rose-500/10 text-rose-300' : 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-white/10 bg-slate-950/50'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-3">Severity score</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSeverityScore(value)}
                          className={`w-11 h-11 rounded-2xl border ${severityScore === value ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300' : 'border-white/10 bg-slate-950/50'}`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Optional reviewer notes"
                      className="w-full min-h-[140px] px-4 py-4 rounded-2xl bg-slate-950/60 border border-white/10 focus:border-fuchsia-500 outline-none resize-none"
                    />
                  </div>

                  {statusLine ? (
                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sky-200 text-sm">
                      {statusLine}
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-sm">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold disabled:from-gray-600 disabled:to-gray-600"
                  >
                    {isPending ? 'Waiting for wallet...' : 'Submit vote'}
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
