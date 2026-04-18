'use client';

import { useState } from 'react';
import { useSubmitVote } from '@/hooks/useReviewerHub';

interface ReviewerVotingPanelProps {
  caseId: number;
  walletAddress: string;
}

export default function ReviewerVotingPanel({ caseId, walletAddress }: ReviewerVotingPanelProps) {
  const { submitVote, isPending } = useSubmitVote();
  const [recommendation, setRecommendation] = useState(1);
  const [severityScore, setSeverityScore] = useState(3);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await submitVote({
        caseId,
        recommendation,
        severityScore,
        notes: `${walletAddress}: ${notes}`.trim(),
      });
      setMessage('Vote submitted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit vote.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-xl bg-dark-700/50 border border-purple-500/30">
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
            className={`py-3 rounded-lg font-medium transition-all ${recommendation === option.value ? 'bg-purple-500 text-white' : 'bg-dark-800 border border-gray-700'}`}
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
            className={`w-12 h-12 rounded-lg font-semibold transition-all ${severityScore === level ? 'bg-purple-500 text-white' : 'bg-dark-800 border border-gray-700'}`}
          >
            {level}
          </button>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-dark-800 border border-gray-700 min-h-[100px]"
        placeholder="Reviewer notes"
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-semibold"
      >
        {isPending ? 'Waiting for wallet...' : 'Submit vote'}
      </button>

      {message ? (
        <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm text-center">{message}</div>
      ) : null}
    </form>
  );
}
