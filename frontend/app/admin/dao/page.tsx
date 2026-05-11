'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Logo from '@/components/Logo';
import AnimatedCounter from '@/components/AnimatedCounter';
import { useDAOProposalCount, useDAOProposal, useDAOActions } from '@/hooks/useDAO';
import { useIsAdmin } from '@/hooks/useAccessControl';
import { CONTRACTS, isContractConfigured } from '@/lib/contracts';
import { formatTimestamp } from '@/lib/report-utils';

const VOTE_TYPES = [
  { label: 'Against', value: 2 as const, color: 'rose' },
  { label: 'Abstain', value: 0 as const, color: 'gray' },
  { label: 'For', value: 1 as const, color: 'emerald' },
];

function ProposalCard({ id, onVote }: { id: number; onVote: (id: number, type: 0 | 1 | 2) => void }) {
  const { proposal, isLoading } = useDAOProposal(id);
  const [selectedVote, setSelectedVote] = useState<0 | 1 | 2 | null>(null);

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    );
  }

  if (!proposal) return null;

  const stateColors: Record<string, string> = {
    Pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    Active: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    Defeated: 'bg-red-500/10 border-red-500/20 text-red-400',
    Succeeded: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    Queued: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    Expired: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
    Executed: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
  };

  const totalVotes = Number(proposal.forVotesNum) + Number(proposal.againstVotesNum) + Number(proposal.abstainVotesNum);
  const forPct = totalVotes > 0 ? (Number(proposal.forVotesNum) / totalVotes) * 100 : 0;
  const againstPct = totalVotes > 0 ? (Number(proposal.againstVotesNum) / totalVotes) * 100 : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-lg font-bold text-white">Proposal #{id}</span>
          <div className="text-xs text-gray-500 mt-1">
            Proposed by <span className="font-mono text-gray-400">{proposal.proposer.slice(0, 10)}...</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${stateColors[proposal.stateLabel] || 'bg-gray-500/10 border-gray-500/20 text-gray-400'}`}>
          {proposal.stateLabel}
        </span>
      </div>

      <div className="text-sm text-gray-400 mb-4 font-mono break-all">
        {proposal.descriptionHash.slice(0, 40)}...
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="p-3 rounded-xl bg-emerald-500/5">
          <div className="text-xl font-bold text-emerald-400">
            {Number(proposal.forVotesNum).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">For</div>
        </div>
        <div className="p-3 rounded-xl bg-rose-500/5">
          <div className="text-xl font-bold text-rose-400">
            {Number(proposal.againstVotesNum).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Against</div>
        </div>
        <div className="p-3 rounded-xl bg-gray-500/5">
          <div className="text-xl font-bold text-gray-400">
            {Number(proposal.abstainVotesNum).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Abstain</div>
        </div>
      </div>

      {totalVotes > 0 && (
        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-rose-400 float-left" style={{ width: `${againstPct}%` }} />
          <div className="h-full bg-emerald-400 float-left" style={{ width: `${forPct}%` }} />
        </div>
      )}

      <div className="text-xs text-gray-500 mb-4">
        Voting: {formatTimestamp(proposal.startTime)} — {formatTimestamp(proposal.endTime)}
      </div>

      {proposal.stateLabel === 'Active' && (
        <div className="flex gap-2">
          {VOTE_TYPES.map(vote => (
            <button
              key={vote.label}
              onClick={() => setSelectedVote(vote.value)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedVote === vote.value
                  ? vote.color === 'emerald' ? 'bg-emerald-500 text-white' :
                    vote.color === 'rose' ? 'bg-rose-500 text-white' :
                    'bg-gray-500 text-white'
                  : 'bg-white/5 border border-white/10 text-gray-400'
              }`}
            >
              {vote.label}
            </button>
          ))}
          <button
            onClick={() => selectedVote !== null && onVote(id, selectedVote)}
            disabled={selectedVote === null}
            className="px-6 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium disabled:opacity-30"
          >
            Cast Vote
          </button>
        </div>
      )}
    </div>
  );
}

export default function DAOPage() {
  const { isConnected, address } = useAccount();
  const { data: adminFlag } = useIsAdmin(address);
  const { count, isLoading: countLoading } = useDAOProposalCount();
  const { propose, castVote, isPending } = useDAOActions();

  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const daoReady = isContractConfigured(CONTRACTS.DAO);

  const handleCreateProposal = async () => {
    setError('');
    if (!description.trim()) {
      setError('Enter a proposal description.');
      return;
    }
    try {
      await propose(description);
      setNotice('Proposal created successfully.');
      setDescription('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create proposal');
    }
  };

  const handleVote = async (proposalId: number, voteType: 0 | 1 | 2) => {
    try {
      await castVote(proposalId, voteType);
      setNotice(`Vote cast on proposal #${proposalId}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cast vote');
    }
  };

  const proposalIds = Array.from({ length: count }, (_, i) => count - 1 - i);

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-teal-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[150px]" />
      </div>

      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs text-teal-400 font-medium">DAO</span>
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <main className="relative pt-28 pb-16 px-6 max-w-7xl mx-auto">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to admin dashboard
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">DAO</span> Governance
          </h1>
          <p className="text-gray-400">
            Create proposals, vote on platform parameters, and manage decentralized governance.
          </p>
        </div>

        {!daoReady ? (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-bold mb-3">DAO Not Configured</h2>
            <p className="text-gray-400">
              Deploy the Wave 3 governance contracts and set NEXT_PUBLIC_DAO to enable proposals.
            </p>
          </div>
        ) : !isConnected ? (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to participate in governance.</p>
            <ConnectButton />
          </div>
        ) : countLoading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
            <p className="text-gray-400 mt-4">Loading DAO state...</p>
          </div>
        ) : (
          <>
            {notice && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                {notice}
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="stats-card">
                <div className="text-sm text-gray-500 mb-2">Total Proposals</div>
                <div className="text-3xl font-bold gradient-text">
                  <AnimatedCounter end={count} />
                </div>
              </div>
              <div className="stats-card">
                <div className="text-sm text-gray-500 mb-2">Voting Delay</div>
                <div className="text-3xl font-bold text-blue-400">1d</div>
              </div>
              <div className="stats-card">
                <div className="text-sm text-gray-500 mb-2">Voting Period</div>
                <div className="text-3xl font-bold text-purple-400">7d</div>
              </div>
              <div className="stats-card">
                <div className="text-sm text-gray-500 mb-2">Quorum</div>
                <div className="text-3xl font-bold text-amber-400">4%</div>
              </div>
            </div>

            <div className="glass-card p-6 mb-10">
              <h3 className="text-xl font-semibold mb-4">Create New Proposal</h3>
              <p className="text-sm text-gray-400 mb-4">
                Submit a governance proposal. Requires voting power (LPROOF tokens). Voting opens after a 1-day delay.
              </p>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Proposal description..."
                  className="input-modern flex-1"
                />
                <button
                  onClick={handleCreateProposal}
                  disabled={isPending || !description.trim()}
                  className="btn-primary px-8"
                >
                  {isPending ? 'Creating...' : 'Create Proposal'}
                </button>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-6">Proposals</h3>
            {proposalIds.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <p className="text-gray-400">No proposals yet. Be the first to create one!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposalIds.map(id => (
                  <ProposalCard key={id} id={id} onVote={handleVote} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
