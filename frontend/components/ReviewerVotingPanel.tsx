'use client';

import { useState } from 'react';
import { useCofheClient } from '@/hooks/useCofheClient';
import { useSubmitVote } from '@/hooks/useReviewerHub';

interface ReviewerVotingPanelProps {
  caseId: number;
  walletAddress: string;
}

export default function ReviewerVotingPanel({ caseId, walletAddress }: ReviewerVotingPanelProps) {
  const { submitVote, isPending } = useSubmitVote();
  const { encryptUint8, isReady: cofheReady } = useCofheClient();
  const [recommendation, setRecommendation] = useState(1);
  const [severityScore, setSeverityScore] = useState(3);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const encryptedRecommendation = await encryptUint8(recommendation);

      await submitVote({
        caseId,
        recommendation: encryptedRecommendation,
        severityScore,
        notes: `${walletAddress}: ${notes}`.trim(),
      });
      setMessage('Vote submitted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit vote.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-2xl bg-slate-950/50 border border-purple-500/30">
      <h3 className="text-lg font-semibold">Confidential review</h3>

      <div className="grid grid-cols-3 gap-2">
        {[
          { value: 1, label: 'Approve' },
          { value: 2, label: 'Reject' },
          { value: 3, label: 'Escalate' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRecommendation(option.value)}
            className={`py-3 rounded-2xl font-medium transition-all ${recommendation === option.value ? 'bg-purple-500 text-white' : 'bg-slate-950/60 border border-white/10'}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setSeverityScore(level)}
            className={`w-12 h-12 rounded-2xl font-semibold transition-all ${severityScore === level ? 'bg-purple-500 text-white' : 'bg-slate-950/60 border border-white/10'}`}
          >
            {level}
          </button>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="w-full px-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 min-h-[100px]"
        placeholder="Reviewer notes"
      />

      <button
        type="submit"
        disabled={isPending || !cofheReady}
        className="w-full py-4 rounded-2xl bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-semibold"
      >
        {isPending ? 'Waiting for wallet...' : !cofheReady ? 'Connecting confidential client...' : 'Submit vote'}
      </button>

      {message ? (
        <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 text-sm text-center">{message}</div>
      ) : null}
    </form>
  );
}
