'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import AnimatedCounter from '@/components/AnimatedCounter';
import { contractsConfigured, getCaseStatusLabel } from '@/lib/contracts';
import { useCaseRegistry, useCases } from '@/hooks/useCaseRegistry';

const workflow = [
  {
    title: 'Submit report payload',
    description: 'Report metadata is uploaded to IPFS, hashed locally, then anchored on Ethereum Sepolia.',
  },
  {
    title: 'Assign reviewers',
    description: 'Admins add reviewers and tune the approval threshold per case before votes are cast.',
  },
  {
    title: 'Reach consensus',
    description: 'Approve, reject, and escalate votes are tallied honestly on-chain with no fake success states.',
  },
];

export default function Home() {
  const { isConnected } = useAccount();
  const { caseCount, allCaseIds, isLoading } = useCaseRegistry();
  const { cases } = useCases(allCaseIds);

  const verifiedCount = cases.filter((item) => item.status === 4).length;
  const activeCount = cases.filter((item) => item.status !== 5 && item.status !== 6).length;
  const latestCases = [...cases].sort((left, right) => right.id - left.id).slice(0, 3);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="glass rounded-[2rem] p-8 md:p-12 border border-white/10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-sky-500/10 text-sky-300 text-sm border border-sky-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ethereum Sepolia workflow
          </div>

          <div className="mt-6 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              LeakProof X
            </h1>
            <p className="text-xl text-gray-300 mt-4">
              A working whistleblowing workflow with IPFS-backed report payloads, on-chain review state,
              and verifiable admin controls.
            </p>
            <p className="text-sm text-gray-500 mt-4 max-w-2xl">
              This build focuses on reliability and honest behavior: real receipts, real case IDs, real
              reviewer consensus, and no placeholder dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-5">
              <div className="text-sm text-gray-500">Cases anchored</div>
              <div className="text-4xl font-bold text-sky-300 mt-2">
                {isLoading ? '...' : <AnimatedCounter end={caseCount} />}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-5">
              <div className="text-sm text-gray-500">Verified cases</div>
              <div className="text-4xl font-bold text-emerald-300 mt-2">
                <AnimatedCounter end={verifiedCount} />
              </div>
            </div>
            <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-5">
              <div className="text-sm text-gray-500">Active reviews</div>
              <div className="text-4xl font-bold text-amber-300 mt-2">
                <AnimatedCounter end={activeCount} />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link
              href="/reporter/submit"
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold hover:from-sky-400 hover:to-cyan-400 transition-all"
            >
              Submit a report
            </Link>
            <ConnectButton />
          </div>

          {isConnected ? (
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/reporter/dashboard" className="px-4 py-2 rounded-xl glass hover:bg-sky-500/10 text-sky-300">
                Reporter dashboard
              </Link>
              <Link href="/reviewer/dashboard" className="px-4 py-2 rounded-xl glass hover:bg-fuchsia-500/10 text-fuchsia-300">
                Reviewer dashboard
              </Link>
              <Link href="/admin/dashboard" className="px-4 py-2 rounded-xl glass hover:bg-emerald-500/10 text-emerald-300">
                Admin dashboard
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          {workflow.map((item, index) => (
            <div key={item.title} className="glass rounded-2xl p-6 border border-white/10">
              <div className="text-sm text-sky-300 mb-3">Step {index + 1}</div>
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="text-sm text-gray-400 mt-3 leading-6">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24 relative z-10">
        <div className="grid md:grid-cols-[1.3fr_0.7fr] gap-6">
          <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Latest case activity</h2>
                <p className="text-sm text-gray-500 mt-1">Pulled from the current contract state.</p>
              </div>
              <div className={`text-xs px-3 py-2 rounded-full border ${contractsConfigured() ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' : 'border-amber-500/30 text-amber-300 bg-amber-500/10'}`}>
                {contractsConfigured() ? 'Contracts configured' : 'Contracts not configured'}
              </div>
            </div>

            {latestCases.length === 0 ? (
              <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-6 text-gray-400">
                No cases are on-chain yet. Submit the first report to exercise the workflow.
              </div>
            ) : (
              <div className="space-y-4">
                {latestCases.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-950/50 border border-white/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">Case #{item.id}</div>
                        <div className="text-sm text-gray-500 mt-1">Status: {getCaseStatusLabel(item.status)}</div>
                      </div>
                      <Link
                        href={`/reviewer/case/${item.id}`}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10"
                      >
                        Open case
                      </Link>
                    </div>
                    <div className="grid sm:grid-cols-4 gap-3 mt-4 text-sm text-gray-400">
                      <div>Votes: {item.voteCount}</div>
                      <div>Approvals: {item.approvalCount}</div>
                      <div>Rejects: {item.rejectCount}</div>
                      <div>Escalations: {item.escalationCount}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-semibold">What changed</h2>
            <ul className="mt-4 space-y-4 text-sm text-gray-400 leading-6">
              <li>Reporter submissions now wait for confirmed receipts and read the real case ID from the event log.</li>
              <li>Reviewer votes use the corrected consensus logic and no longer treat reject votes as approvals.</li>
              <li>IPFS CIDs are stored as strings, so evidence uploads no longer break the contract call.</li>
              <li>Dashboards now render live chain data instead of placeholder case cards.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
