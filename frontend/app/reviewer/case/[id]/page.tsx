'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useSubmitVote, useIsReviewerAssigned } from '@/hooks/useReviewerHub';
import { useCaseStatus } from '@/hooks/useCaseRegistry';

export default function ReviewerCaseDetail({ params }: { params: { id: string } }) {
  const caseId = parseInt(params.id);
  const { isConnected, address } = useAccount();
  const { submitVote, isPending, isSuccess } = useSubmitVote();
  const { isAssigned, isLoading: checkingAssignment } = useIsReviewerAssigned(caseId, address);
  const { status } = useCaseStatus(caseId);

  const [voteData, setVoteData] = useState({
    recommendation: 'approve',
    severityScore: 3,
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    submitVote({
      caseId: BigInt(caseId),
      encryptedVote: `0x${Buffer.from(voteData.recommendation).toString('hex').padEnd(64, '0')}` as `0x${string}`,
      encryptedScore: `0x${Buffer.from(voteData.severityScore.toString()).toString('hex').padEnd(64, '0')}` as `0x${string}`,
      encryptedNotes: `0x${Buffer.from(voteData.notes).toString('hex').padEnd(64, '0')}` as `0x${string}`,
    });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen relative">
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/reviewer/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white">&#128274;</span>
            </div>
            <span className="text-xl font-bold gradient-text">LeakProof X</span>
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {submitted || isSuccess ? (
          <div className="text-center py-20 slide-up">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-8 pulse-glow">
              <svg className="w-16 h-16 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 gradient-text">Vote Submitted!</h1>
            <p className="text-gray-400 mb-8">Your encrypted vote has been recorded on-chain.</p>
            <Link href="/reviewer/dashboard" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold transition-all hover-lift">
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <Link href="/reviewer/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors slide-up">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Dashboard
            </Link>

            <div className="mb-8 slide-up">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Review Case <span className="gradient-text">#{caseId}</span>
              </h1>
              <p className="text-gray-400">Submit your confidential evaluation</p>
            </div>

            {checkingAssignment ? (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 mt-4">Checking assignment...</p>
              </div>
            ) : !isAssigned ? (
              <div className="glass rounded-2xl p-8 text-center slide-up animate-delay-100">
                <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Not Assigned</h2>
                <p className="text-gray-400">You are not assigned to review this case.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitVote} className="space-y-6">
                <div className="glass rounded-2xl p-6 slide-up animate-delay-100">
                  <label className="block text-sm font-medium mb-4 text-gray-300">Recommendation</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'approve', label: 'Approve', color: 'emerald', icon: 'M5 13l4 4L19 7' },
                      { id: 'reject', label: 'Reject', color: 'red', icon: 'M6 18L18 6M6 6l12 12' },
                      { id: 'escalate', label: 'Escalate', color: 'amber', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
                    ].map((rec) => (
                      <button key={rec.id} type="button" onClick={() => setVoteData({ ...voteData, recommendation: rec.id })} className={`py-4 px-6 rounded-xl font-semibold transition-all flex flex-col items-center gap-2 ${voteData.recommendation === rec.id ? (rec.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white scale-105' : rec.color === 'red' ? 'bg-gradient-to-br from-red-500 to-rose-500 text-white scale-105' : 'bg-gradient-to-br from-amber-500 to-orange-500 text-black scale-105') : 'bg-dark-800 border border-gray-700 hover:border-purple-500'}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={rec.icon} /></svg>
                        {rec.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 slide-up animate-delay-150">
                  <label className="block text-sm font-medium mb-4 text-gray-300">Severity Score (1-5)</label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button key={level} type="button" onClick={() => setVoteData({ ...voteData, severityScore: level })} className={`w-14 h-14 rounded-xl font-bold transition-all hover-lift ${voteData.severityScore === level ? (level === 1 ? 'bg-green-500 text-white scale-110' : level === 2 ? 'bg-lime-500 text-white scale-110' : level === 3 ? 'bg-yellow-500 text-black scale-110' : level === 4 ? 'bg-orange-500 text-white scale-110' : 'bg-red-500 text-white scale-110') : 'bg-dark-800 border border-gray-700 hover:border-purple-500'}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 slide-up animate-delay-200">
                  <label className="block text-sm font-medium mb-3 text-gray-300">Confidential Notes (Optional)</label>
                  <textarea value={voteData.notes} onChange={(e) => setVoteData({ ...voteData, notes: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-dark-800 border border-gray-700 focus:border-purple-500 outline-none min-h-[150px] resize-none" placeholder="Add any additional notes about this case..." />
                </div>

                <button type="submit" disabled={isPending} className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold transition-all flex items-center justify-center gap-2 button-glow">
                  {isPending ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Encrypting Vote...</>
                  ) : (
                    <>&#128274; Submit Encrypted Vote</>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}