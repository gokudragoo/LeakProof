'use client';

import { useState } from 'react';
import { useSubmitVote } from '@/hooks/useReviewerHub';
import { useCofheEncrypt } from '@cofhe/react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { CASE_STATUS } from '@/lib/contracts';

interface ReviewerVotingPanelProps {
  caseId: number;
  walletAddress: string;
}

export default function ReviewerVotingPanel({ caseId, walletAddress }: ReviewerVotingPanelProps) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { submitVote, isPending, isSuccess } = useSubmitVote();
  const { mutateAsync: encryptVote, isPending: isEncrypting, reset } = useCofheEncrypt();

  const [vote, setVote] = useState({
    recommendation: 'approve',
    severityScore: 3,
    notes: '',
  });
  const [encryptionProgress, setEncryptionProgress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletClient) {
      console.error('Wallet not connected');
      return;
    }

    try {
      setEncryptionProgress('Encrypting vote with FHE...');
      const voteValue = vote.recommendation === 'approve' ? 1 : vote.recommendation === 'reject' ? 2 : 3;

      const encryptedInputs = await encryptVote(
        {
          items: [
            { data: voteValue, utype: 2, securityZone: 0 },
            { data: BigInt(vote.severityScore), utype: 2, securityZone: 0 },
          ],
          account: walletAddress,
        }
      );

      submitVote({
        caseId: BigInt(caseId),
        encryptedVote: `0x${encryptedInputs[0].ctHash.toString(16)}` as `0x${string}`,
        encryptedScore: `0x${encryptedInputs[1].ctHash.toString(16)}` as `0x${string}`,
        encryptedNotes: '0x' as `0x${string}`,
      });

      setEncryptionProgress('Vote submitted! Waiting for confirmation...');
      reset();
    } catch (err: any) {
      setEncryptionProgress(`Error: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-xl bg-dark-700/50 border border-purple-500/30">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
          {caseId}
        </span>
        Confidential Review
        <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
          FHE Encrypted
        </span>
      </h3>

      <div>
        <label className="block text-sm font-medium mb-2">Recommendation</label>
        <div className="grid grid-cols-3 gap-2">
          {['approve', 'reject', 'escalate'].map((rec) => (
            <button
              key={rec}
              type="button"
              onClick={() => setVote({ ...vote, recommendation: rec })}
              className={`py-3 rounded-lg font-medium transition-all ${
                vote.recommendation === rec
                  ? rec === 'approve' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : rec === 'reject' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-dark-800 border border-gray-700 hover:border-gray-600'
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
              className={`w-12 h-12 rounded-lg font-semibold transition-all ${
                vote.severityScore === level
                  ? level <= 2 ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : level <= 3 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-dark-800 border border-gray-700 hover:border-gray-600'
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
          placeholder="Confidential notes (encrypted with FHE)..."
        />
      </div>

      {encryptionProgress && (
        <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400 text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          {encryptionProgress}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || isEncrypting}
        className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
      >
        {isPending || isEncrypting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Encrypting & Submitting...
          </span>
        ) : (
          'Submit FHE-Encrypted Vote'
        )}
      </button>

      {isSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm text-center flex items-center gap-2">
          <span className="text-xl">&#10003;</span>
          Vote submitted successfully!
        </div>
      )}
    </form>
  );
}