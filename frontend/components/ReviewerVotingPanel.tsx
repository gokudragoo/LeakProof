'use client';

import { useState } from 'react';
import { useSubmitVote } from '@/hooks/useReviewerHub';
import { deriveKeyFromWallet, encryptField } from '@/lib/cofhe';

interface ReviewerVotingPanelProps {
  caseId: number;
  walletAddress: string;
}

export default function ReviewerVotingPanel({ caseId, walletAddress }: ReviewerVotingPanelProps) {
  const { submitVote, isPending, isSuccess } = useSubmitVote();

  const [vote, setVote] = useState({
    recommendation: 'approve',
    severityScore: 3,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const key = deriveKeyFromWallet(walletAddress, caseId.toString());

    const encryptedVote = encryptField(vote.recommendation, key);
    const encryptedScore = encryptField(vote.severityScore.toString(), key);
    const encryptedNotes = encryptField(vote.notes, key);

    submitVote({
      caseId: BigInt(caseId),
      encryptedVote: `0x${Buffer.from(encryptedVote).toString('hex')}` as `0x${string}`,
      encryptedScore: `0x${Buffer.from(encryptedScore).toString('hex')}` as `0x${string}`,
      encryptedNotes: `0x${Buffer.from(encryptedNotes).toString('hex')}` as `0x${string}`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-xl bg-dark-700/50 border border-purple-500/30">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
          {caseId}
        </span>
        Confidential Review
      </h3>

      <div>
        <label className="block text-sm font-medium mb-2">Recommendation</label>
        <div className="grid grid-cols-3 gap-2">
          {['approve', 'reject', 'escalate'].map((rec) => (
            <button
              key={rec}
              type="button"
              onClick={() => setVote({ ...vote, recommendation: rec })}
              className={`py-3 rounded-lg font-medium ${
                vote.recommendation === rec
                  ? rec === 'approve' ? 'bg-emerald-500 text-white'
                    : rec === 'reject' ? 'bg-red-500 text-white'
                    : 'bg-amber-500 text-black'
                  : 'bg-dark-800 border border-gray-700'
              }`}
            >
              {rec.charAt(0).toUpperCase() + rec.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Severity Score</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setVote({ ...vote, severityScore: level })}
              className={`w-12 h-12 rounded-lg font-semibold ${
                vote.severityScore === level
                  ? level <= 2 ? 'bg-green-500 text-white' : level <= 3 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                  : 'bg-dark-800 border border-gray-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Encrypted Notes</label>
        <textarea
          value={vote.notes}
          onChange={(e) => setVote({ ...vote, notes: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-dark-800 border border-gray-700 min-h-[100px]"
          placeholder="Confidential notes (will be encrypted)..."
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-semibold"
      >
        {isPending ? 'Encrypting Vote...' : 'Submit Encrypted Vote'}
      </button>

      {isSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm text-center">
          Vote submitted successfully!
        </div>
      )}
    </form>
  );
}