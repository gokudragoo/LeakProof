'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useSubmitVote } from '@/hooks/useReviewerHub';
import { deriveKeyFromWallet, encryptField } from '@/lib/cofhe';
import { CASE_CATEGORY, CASE_STATUS } from '@/lib/contracts';

export default function ReviewerCaseDetail({ params }: { params: { id: string } }) {
  const caseId = parseInt(params.id);
  const { isConnected, address } = useAccount();
  const { submitVote, isPending, isSuccess } = useSubmitVote();

  const [voteData, setVoteData] = useState({
    recommendation: 'approve',
    severityScore: '3',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) return;

    const key = deriveKeyFromWallet(address, caseId.toString());

    const encryptedVote = encryptField(voteData.recommendation, key);
    const encryptedScore = encryptField(voteData.severityScore, key);
    const encryptedNotes = encryptField(voteData.notes, key);

    const encryptedVoteBytes = `0x${Buffer.from(encryptedVote).toString('hex')}` as `0x${string}`;
    const encryptedScoreBytes = `0x${Buffer.from(encryptedScore).toString('hex')}` as `0x${string}`;
    const encryptedNotesBytes = `0x${Buffer.from(encryptedNotes).toString('hex')}` as `0x${string}`;

    submitVote({
      caseId: BigInt(caseId),
      encryptedVote: encryptedVoteBytes,
      encryptedScore: encryptedScoreBytes,
      encryptedNotes: encryptedNotesBytes,
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="border-b border-gray-800 bg-dark-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/reviewer/dashboard" className="flex items-center gap-2">
            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xl font-bold gradient-text">LeakProof X</span>
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {submitted ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 gradient-text">Vote Submitted!</h1>
            <p className="text-gray-400 mb-6">Your confidential vote has been recorded on-chain.</p>
            <Link
              href="/reviewer/dashboard"
              className="px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <Link href="/reviewer/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Review Case #{caseId}</h1>
              <p className="text-gray-400">Submit your confidential evaluation</p>
            </div>

            <form onSubmit={handleSubmitVote} className="space-y-6">
              {/* Recommendation */}
              <div>
                <label className="block text-sm font-medium mb-2">Recommendation</label>
                <div className="grid grid-cols-3 gap-4">
                  {['approve', 'reject', 'escalate'].map((rec) => (
                    <button
                      key={rec}
                      type="button"
                      onClick={() => setVoteData({ ...voteData, recommendation: rec })}
                      className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                        voteData.recommendation === rec
                          ? rec === 'approve' ? 'bg-emerald-500 text-white'
                            : rec === 'reject' ? 'bg-red-500 text-white'
                            : 'bg-amber-500 text-black'
                          : 'bg-dark-700 border border-gray-700 hover:border-purple-500'
                      }`}
                    >
                      {rec.charAt(0).toUpperCase() + rec.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Score */}
              <div>
                <label className="block text-sm font-medium mb-2">Severity Score (1-5)</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setVoteData({ ...voteData, severityScore: level.toString() })}
                      className={`w-12 h-12 rounded-lg font-semibold transition-colors ${
                        voteData.severityScore === level.toString()
                          ? level <= 2 ? 'bg-green-500 text-white' : level <= 3 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                          : 'bg-dark-700 border border-gray-700 hover:border-purple-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Confidential Notes (Optional)</label>
                <textarea
                  value={voteData.notes}
                  onChange={(e) => setVoteData({ ...voteData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors min-h-[150px]"
                  placeholder="Add any additional notes about this case. These will be encrypted."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {isPending ? 'Submitting...' : 'Submit Encrypted Vote'}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}