'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainId, usePublicClient } from 'wagmi';
import Logo from '@/components/Logo';
import { CONTRACTS, isContractConfigured } from '@/lib/contracts';
import { shortAddress } from '@/lib/report-utils';
import { getTransactionObservations, type TransactionObservation } from '@/lib/tx-observer';
import { loadIndexedActivity, type IndexedActivity } from '@/lib/wave5-indexer';

type ModuleState = 'checking' | 'live' | 'missing' | 'unconfigured' | 'error';

type ModuleCheck = {
  key: keyof typeof CONTRACTS;
  label: string;
  lane: string;
  critical: boolean;
  state: ModuleState;
  bytecodeSize?: number;
};

const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io/address/';

const MODULES: Array<Omit<ModuleCheck, 'state' | 'bytecodeSize'>> = [
  { key: 'ACCESS_CONTROL', label: 'Access Control', lane: 'Core', critical: true },
  { key: 'CORE', label: 'Case Registry', lane: 'Core', critical: true },
  { key: 'REVIEWER_HUB', label: 'Reviewer Hub', lane: 'Core', critical: true },
  { key: 'DISCLOSURE_CTRL', label: 'Disclosure Controller', lane: 'Core', critical: true },
  { key: 'TOKEN', label: 'LeakProof Token', lane: 'Governance', critical: true },
  { key: 'REPUTATION', label: 'Reputation Registry', lane: 'Reputation', critical: true },
  { key: 'TIMELOCKED', label: 'Time-Locked Disclosure', lane: 'Wave 4', critical: true },
  { key: 'DAO', label: 'DAO Governance', lane: 'Wave 4', critical: true },
];

const stateStyles: Record<ModuleState, string> = {
  checking: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
  live: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  missing: 'bg-red-500/10 border-red-500/20 text-red-300',
  unconfigured: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
  error: 'bg-red-500/10 border-red-500/20 text-red-300',
};

function StateBadge({ state }: { state: ModuleState }) {
  const labels: Record<ModuleState, string> = {
    checking: 'Checking',
    live: 'Live',
    missing: 'No Code',
    unconfigured: 'Missing Env',
    error: 'RPC Error',
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold ${stateStyles[state]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[state]}
    </span>
  );
}

export default function OperationsPage() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [checks, setChecks] = useState<ModuleCheck[]>(
    MODULES.map((module) => ({ ...module, state: 'checking' }))
  );
  const [latestBlock, setLatestBlock] = useState<bigint | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activity, setActivity] = useState<IndexedActivity[]>([]);
  const [activityWindow, setActivityWindow] = useState<{ fromBlock: bigint; latestBlock: bigint } | null>(null);
  const [txObservations, setTxObservations] = useState<TransactionObservation[]>([]);

  const runChecks = async () => {
    setIsRefreshing(true);
    setChecks(MODULES.map((module) => ({ ...module, state: 'checking' })));

    if (!publicClient) {
      setChecks(MODULES.map((module) => ({ ...module, state: 'error' })));
      setIsRefreshing(false);
      return;
    }

    try {
      const [block, nextChecks] = await Promise.all([
        publicClient.getBlockNumber(),
        Promise.all(
          MODULES.map(async (module) => {
            const address = CONTRACTS[module.key];
            if (!isContractConfigured(address)) {
              return { ...module, state: 'unconfigured' as const };
            }

            try {
              const bytecode = await publicClient.getBytecode({ address });
              return {
                ...module,
                state: bytecode && bytecode !== '0x' ? ('live' as const) : ('missing' as const),
                bytecodeSize: bytecode && bytecode !== '0x' ? (bytecode.length - 2) / 2 : 0,
              };
            } catch {
              return { ...module, state: 'error' as const };
            }
          })
        ),
      ]);

      setLatestBlock(block);
      setChecks(nextChecks);
      try {
        const indexed = await loadIndexedActivity(publicClient);
        setActivity(indexed.activity.slice(0, 12));
        setActivityWindow({ fromBlock: indexed.fromBlock, latestBlock: indexed.latestBlock });
      } catch {
        setActivity([]);
        setActivityWindow(null);
      }
      setTxObservations(getTransactionObservations());
      setLastChecked(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient]);

  useEffect(() => {
    setTxObservations(getTransactionObservations());
  }, []);

  const summary = useMemo(() => {
    const live = checks.filter((check) => check.state === 'live').length;
    const requiredLive = checks.filter((check) => check.critical && check.state === 'live').length;
    const required = checks.filter((check) => check.critical).length;

    return {
      live,
      requiredLive,
      required,
      ready: requiredLive === required,
    };
  }, [checks]);

  return (
    <div className="min-h-screen bg-[#050508]">
      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Wave 5 Ready</span>
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-7xl px-6 pb-16 pt-28">
        <Link href="/admin/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to admin dashboard
        </Link>

        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-3 text-4xl font-bold md:text-5xl">
              <span className="gradient-text">Operations</span> Health
            </h1>
            <p className="max-w-3xl text-gray-400">
              Verify the live Sepolia deployment before demos, reviews, and production handoff.
            </p>
          </div>
          <button
            type="button"
            onClick={runChecks}
            disabled={isRefreshing}
            className="btn-secondary inline-flex items-center justify-center gap-2 px-5 py-3"
          >
            <svg className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0119 5M19 5h-5m5 0v5" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="stats-card">
            <div className="mb-2 text-sm text-gray-500">Release State</div>
            <div className={`text-2xl font-bold ${summary.ready ? 'text-emerald-300' : 'text-amber-300'}`}>
              {summary.ready ? 'Ready' : 'Attention'}
            </div>
          </div>
          <div className="stats-card">
            <div className="mb-2 text-sm text-gray-500">Live Modules</div>
            <div className="text-2xl font-bold text-sky-300">{summary.live}/{checks.length}</div>
          </div>
          <div className="stats-card">
            <div className="mb-2 text-sm text-gray-500">Chain</div>
            <div className="text-2xl font-bold text-purple-300">#{chainId}</div>
          </div>
          <div className="stats-card">
            <div className="mb-2 text-sm text-gray-500">Latest Block</div>
            <div className="text-2xl font-bold text-amber-300">{latestBlock?.toString() ?? '...'}</div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="border-b border-white/5 px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Deployment Modules</h2>
              <div className="text-xs text-gray-500">
                {lastChecked ? `Checked ${lastChecked.toLocaleTimeString()}` : 'Checking...'}
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {checks.map((check) => {
              const address = CONTRACTS[check.key];
              const configured = isContractConfigured(address);

              return (
                <div key={check.key} className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_160px_160px_130px] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-white">{check.label}</h3>
                      <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-gray-400">{check.lane}</span>
                    </div>
                    <div className="mt-2 font-mono text-sm text-gray-500">
                      {configured ? shortAddress(address) : 'Not configured'}
                    </div>
                  </div>
                  <StateBadge state={check.state} />
                  <div className="text-sm text-gray-400">
                    {check.bytecodeSize ? `${check.bytecodeSize.toLocaleString()} bytes` : '-'}
                  </div>
                  {configured ? (
                    <a
                      href={`${SEPOLIA_EXPLORER}${address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary inline-flex items-center justify-center px-4 py-2 text-sm"
                    >
                      Explorer
                    </a>
                  ) : (
                    <span className="text-sm text-gray-600">Explorer</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="glass-card overflow-hidden">
            <div className="border-b border-white/5 px-6 py-5">
              <h2 className="text-xl font-semibold">Indexed Activity</h2>
              <p className="mt-1 text-xs text-gray-500">
                {activityWindow
                  ? `Blocks ${activityWindow.fromBlock.toString()}-${activityWindow.latestBlock.toString()}`
                  : 'Waiting for RPC history'}
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {activity.length === 0 ? (
                <div className="px-6 py-8 text-sm text-gray-500">No recent case, vote, or assignment events found.</div>
              ) : (
                activity.map((item) => (
                  <div key={`${item.transactionHash}-${item.type}-${item.caseId}`} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-white">{item.type}</div>
                        <div className="mt-1 text-sm text-gray-500">
                          Case #{item.caseId} {item.actor ? `by ${shortAddress(item.actor)}` : ''}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">Block {item.blockNumber.toString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="border-b border-white/5 px-6 py-5">
              <h2 className="text-xl font-semibold">Transaction Watch</h2>
              <p className="mt-1 text-xs text-gray-500">Recent submitted, confirmed, and failed wallet actions on this device.</p>
            </div>
            <div className="divide-y divide-white/5">
              {txObservations.length === 0 ? (
                <div className="px-6 py-8 text-sm text-gray-500">No tracked wallet actions yet.</div>
              ) : (
                txObservations.slice(0, 8).map((item) => (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-white">{item.action}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {item.hash ? shortAddress(item.hash) : item.message ?? 'No transaction hash'}
                        </div>
                      </div>
                      <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                        item.status === 'confirmed'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                          : item.status === 'failed'
                            ? 'border-red-500/20 bg-red-500/10 text-red-300'
                            : 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="glass-card mt-8 p-6">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">L2 Readiness</h2>
              <p className="mt-1 max-w-3xl text-sm text-gray-500">
                Sepolia remains the active production testnet. Base Sepolia and Arbitrum Sepolia are prepared for lower-fee redeploys once bridge custody is approved.
              </p>
            </div>
            <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">Plan Ready</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {['Ethereum Sepolia', 'Base Sepolia', 'Arbitrum Sepolia'].map((network, index) => (
              <div key={network} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="font-semibold text-white">{network}</div>
                <div className="mt-2 text-sm text-gray-500">
                  {index === 0 ? 'Live deployment and smoke tests' : 'Bridge plan and chain-switch UX documented'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
