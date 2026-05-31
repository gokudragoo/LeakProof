'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Logo from '@/components/Logo';
import { useIsAdmin } from '@/hooks/useAccessControl';
import { useEmergencyPauseActive, useTimeLockedDisclosureActions } from '@/hooks/useTimeLockedDisclosure';
import { useAllCaseIds } from '@/hooks/useCaseRegistry';
import { useDisclosureLock } from '@/hooks/useTimeLockedDisclosure';
import { CONTRACTS, isContractConfigured } from '@/lib/contracts';

const DISCLOSURE_TYPES = [
  'IdentityReveal',
  'EvidenceAccess',
  'FullReport',
  'SummaryExport',
];

function LockCard({ caseId }: { caseId: number }) {
  const { lock, isLoading } = useDisclosureLock(caseId);
  const {
    createAccessLock,
    createLock,
    approveUnlock,
    triggerUnlock,
    revokeLock,
    initiateEmergencyOverride,
    executeEmergencyOverride,
    cancelEmergencyOverride,
    isPending,
  } = useTimeLockedDisclosureActions();
  const [duration, setDuration] = useState(7);
  const [approvals, setApprovals] = useState(2);
  const [grantee, setGrantee] = useState('');
  const [permissionLevel, setPermissionLevel] = useState(3);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const handleCreateLock = async () => {
    setError('');
    setNotice('');
    try {
      if (grantee.trim()) {
        await createAccessLock(caseId, duration * 86400, approvals, DISCLOSURE_TYPES[0], grantee.trim(), permissionLevel);
      } else {
        await createLock(caseId, duration * 86400, approvals, DISCLOSURE_TYPES[0]);
      }
      setNotice(`Disclosure lock created for case #${caseId}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create lock');
    }
  };

  const handleRevoke = async () => {
    setError('');
    setNotice('');
    try {
      await revokeLock(caseId);
      setNotice('Disclosure lock revoked.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke lock');
    }
  };

  const handleInitiateEmergency = async () => {
    setError('');
    setNotice('');
    try {
      await initiateEmergencyOverride(caseId, emergencyReason || 'Emergency disclosure review');
      setNotice('Emergency override initiated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initiate emergency override');
    }
  };

  const handleExecuteEmergency = async () => {
    setError('');
    setNotice('');
    try {
      await executeEmergencyOverride(caseId);
      setNotice('Emergency override executed.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to execute emergency override');
    }
  };

  const handleCancelEmergency = async () => {
    setError('');
    setNotice('');
    try {
      await cancelEmergencyOverride(caseId);
      setNotice('Emergency override cancelled.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel emergency override');
    }
  };

  const handleApprove = async () => {
    setError('');
    try {
      await approveUnlock(caseId);
      setNotice('Approval recorded.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve');
    }
  };

  const handleTrigger = async () => {
    setError('');
    try {
      await triggerUnlock(caseId);
      setNotice('Disclosure unlocked.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to trigger unlock');
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h remaining`;
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m remaining`;
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    );
  }

  const isUnlocked = Boolean(lock?.emergencyUnlock);
  const canUnlock = Boolean(lock?.canEmergencyUnlock && !isUnlocked);
  const isReadyToUnlock = Boolean(lock && lock.timeRemaining === 0 && !isUnlocked && !lock.revoked);

  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-lg font-bold text-white">Case #{caseId}</span>
          {lock?.unlockTimestamp ? (
            <div className="text-xs text-gray-500 mt-1">
              Unlocks: {new Date(lock.unlockTimestamp * 1000).toLocaleString()}
            </div>
          ) : null}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          !lock ? 'bg-gray-500/10 border border-gray-500/20 text-gray-400' :
          isUnlocked ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
          isReadyToUnlock ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
          'bg-amber-500/10 border border-amber-500/20 text-amber-400'
        }`}>
          {!lock ? 'No Lock' : isUnlocked ? 'Unlocked' : isReadyToUnlock ? 'Ready' : 'Locked'}
        </span>
      </div>

      {notice && <div className="mb-3 p-3 rounded-lg bg-emerald-500/10 text-emerald-300 text-sm">{notice}</div>}
      {error && <div className="mb-3 p-3 rounded-lg bg-red-500/10 text-red-300 text-sm">{error}</div>}

      {lock ? (
        <>
          {lock.timeRemaining > 0 && !isUnlocked && (
            <div className="mb-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <div className="text-sm text-amber-400 mb-1">Time-Locked</div>
              <div className="text-2xl font-bold text-white">{formatTimeRemaining(lock.timeRemaining)}</div>
              <div className="mt-2 text-xs text-gray-400">
                {lock.currentApprovals}/{lock.requiredApprovals} admin approvals collected
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {!isUnlocked ? (
              <>
                <button onClick={handleApprove} disabled={isPending} className="btn-primary text-sm">
                  {isPending ? 'Approving...' : 'Approve Unlock'}
                </button>
                {canUnlock && (
                  <button onClick={handleTrigger} disabled={isPending} className="btn-secondary text-sm">
                    Trigger Unlock
                  </button>
                )}
                <button onClick={handleRevoke} disabled={isPending || lock.revoked} className="btn-secondary text-sm">
                  Revoke Lock
                </button>
              </>
            ) : (
              <span className="text-sm text-emerald-400">Disclosure is unlocked and accessible.</span>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-400">No lock configured for this case.</div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 w-full mb-2">
              <label className="text-sm text-gray-400">Duration (days)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-modern w-20 text-center"
              />
              <label className="text-sm text-gray-400">Required Approvals</label>
              <input
                type="number"
                min={0}
                max={5}
                value={approvals}
                onChange={(e) => setApprovals(Number(e.target.value))}
                className="input-modern w-20 text-center"
              />
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-[1fr_140px]">
              <input
                value={grantee}
                onChange={(e) => setGrantee(e.target.value)}
                placeholder="0x optional grantee unlocked by this lock"
                className="input-modern"
              />
              <select
                value={permissionLevel}
                onChange={(e) => setPermissionLevel(Number(e.target.value))}
                className="input-modern"
              >
                <option value={1}>Outcome</option>
                <option value={2}>Summary</option>
                <option value={3}>Full Report</option>
                <option value={4}>Identity</option>
              </select>
            </div>
            <button onClick={handleCreateLock} disabled={isPending} className="btn-primary text-sm">
              {isPending ? 'Creating...' : 'Create Lock'}
            </button>
          </div>
        </>
      )}
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Emergency Override</div>
        <input
          value={emergencyReason}
          onChange={(e) => setEmergencyReason(e.target.value)}
          placeholder="Reason for emergency override"
          className="input-modern mb-3"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={handleInitiateEmergency} disabled={isPending} className="btn-secondary text-sm">
            Initiate
          </button>
          <button onClick={handleExecuteEmergency} disabled={isPending} className="btn-secondary text-sm">
            Execute
          </button>
          <button onClick={handleCancelEmergency} disabled={isPending} className="btn-secondary text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TimeLockPage() {
  const { isConnected, address } = useAccount();
  const { data: adminFlag } = useIsAdmin(address);
  const { caseIds } = useAllCaseIds();
  const { toggleEmergencyPause, isPending } = useTimeLockedDisclosureActions();
  const { emergencyActive, refetch: refetchEmergencyPause } = useEmergencyPauseActive();
  const timelockReady = isContractConfigured(CONTRACTS.TIMELOCKED);

  const handleTogglePause = async () => {
    try {
      await toggleEmergencyPause(!emergencyActive);
      await refetchEmergencyPause();
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-[#050508]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-rose-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-orange-600/10 to-transparent rounded-full blur-[150px]" />
      </div>

      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-xs text-rose-400 font-medium">Time-Lock</span>
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
            <span className="gradient-text">Time-Locked</span> Disclosure
          </h1>
          <p className="text-gray-400">
            Control when sensitive information becomes accessible. Time delays, multi-approval triggers, and emergency overrides.
          </p>
        </div>

        {!timelockReady ? (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-bold mb-3">Time-Lock Not Configured</h2>
            <p className="text-gray-400">
              Deploy the Wave 4 disclosure contract and set NEXT_PUBLIC_TIMELOCKED to manage locks.
            </p>
          </div>
        ) : !isConnected || !adminFlag ? (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-bold mb-3">
              {!isConnected ? 'Connect Your Wallet' : 'Admin Access Required'}
            </h2>
            <p className="text-gray-400 mb-8">
              {!isConnected ? 'Connect your wallet to manage time-locked disclosures.' : 'Only admins can manage disclosure locks.'}
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="stats-card">
                <div className="text-sm text-gray-500 mb-2">Total Cases</div>
                <div className="text-3xl font-bold gradient-text">{caseIds.length}</div>
              </div>
              <div className="stats-card">
                <div className="text-sm text-gray-500 mb-2">Lock Duration</div>
                <div className="text-3xl font-bold text-amber-400">7d</div>
              </div>
              <div className="stats-card">
                <div className="text-sm text-gray-500 mb-2">Min Lock</div>
                <div className="text-3xl font-bold text-purple-400">1d</div>
              </div>
              <div className="stats-card">
                <div className="text-sm text-gray-500 mb-2">Max Lock</div>
                <div className="text-3xl font-bold text-blue-400">90d</div>
              </div>
            </div>

            <div className="glass-card p-6 mb-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Emergency Pause</h3>
                  <p className="text-sm text-gray-400">
                    Pause all new disclosure locks. Does not affect existing locks.
                  </p>
                </div>
                <button
                  onClick={handleTogglePause}
                  disabled={isPending}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    emergencyActive
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {isPending ? 'Processing...' : emergencyActive ? 'Pause Active — Click to Deactivate' : 'Activate Pause'}
                </button>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-6">Case Disclosure Locks</h3>
            {caseIds.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <p className="text-gray-400">No cases exist yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {caseIds.map(id => (
                  <LockCard key={id} caseId={id} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
