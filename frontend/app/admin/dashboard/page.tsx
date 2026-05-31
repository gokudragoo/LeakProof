'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import AnimatedCounter from '@/components/AnimatedCounter';
import Logo from '@/components/Logo';
import {
  CASE_STATUS,
  getCaseCategoryLabel,
  getCaseStatusLabel,
  getPermissionLevelLabel,
} from '@/lib/contracts';
import { createComplianceExportPack, downloadComplianceExport } from '@/lib/compliance-export';
import { formatTimestamp, shortAddress } from '@/lib/report-utils';
import { useGrantReviewerRole, useIsAdmin } from '@/hooks/useAccessControl';
import { useAllCaseIds, useCases, useUpdateCaseStatus } from '@/hooks/useCaseRegistry';
import { useCofheClient } from '@/hooks/useCofheClient';
import { useDisclosureCtrl, useDisclosureLog, useDisclosureRequests, useIdentityReveal } from '@/hooks/useDisclosureCtrl';
import {
  useAuthorizeVoteSummaryAccess,
  useEncryptedVoteSummary,
  usePublishConsensus,
  useReviewerHub,
} from '@/hooks/useReviewerHub';
const permissionOptions = [1, 2, 3, 4];

function isValidAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function StatusBadge({ status }: { status: number }) {
  const labels = ['Submitted', 'Under Review', 'Needs Evidence', 'Escalated', 'Verified', 'Closed', 'Rejected'];
  const classes = [
    'badge-submitted',
    'badge-review',
    'badge-submitted',
    'badge-escalated',
    'badge-verified',
    'badge-closed',
    'badge-rejected',
  ];

  return (
    <span className={`badge ${classes[status] || 'badge-submitted'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[status] || 'Unknown'}
    </span>
  );
}

function Input({ value, onChange, placeholder, className = '' }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`input-modern ${className}`}
    />
  );
}

function Button({ onClick, disabled, loading, children, variant = 'primary', className = '' }: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/25',
    secondary: 'bg-white/5 border border-white/10 hover:bg-white/10',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          Processing...
        </span>
      ) : children}
    </button>
  );
}

export default function AdminDashboard() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { data: adminFlag, isLoading: adminLoading } = useIsAdmin(address);
  const { caseIds, isLoading: idsLoading } = useAllCaseIds();
  const { cases, isLoading: casesLoading } = useCases(caseIds);
  const { assignReviewer, setApprovalThreshold, isPending: reviewerHubPending } = useReviewerHub();
  const { authorize, isPending: authorizePending } = useAuthorizeVoteSummaryAccess();
  const { publishConsensus, isPending: publishPending } = usePublishConsensus();
  const { grantAccess, revokeAccess, resolveRequest, revealIdentity, isPending: disclosurePending } = useDisclosureCtrl();
  const { updateStatus, isPending: statusPending } = useUpdateCaseStatus();
  const { grantReviewerRole, isPending: rolePending } = useGrantReviewerRole();
  const { decryptHandleForTx, isReady: cofheReady } = useCofheClient();

  const [selectedCaseId, setSelectedCaseId] = useState<number>(0);
  const [reviewerAddress, setReviewerAddress] = useState('');
  const [threshold, setThreshold] = useState(2);
  const [disclosureAddress, setDisclosureAddress] = useState('');
  const [permissionLevel, setPermissionLevel] = useState(2);
  const [nextStatus, setNextStatus] = useState(2);
  const [roleAddress, setRoleAddress] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const { handles: encryptedSummaryHandles } = useEncryptedVoteSummary(selectedCaseId);

  const sortedCases = [...cases].sort((left, right) => right.updatedAt - left.updatedAt);
  const selectedCase = sortedCases.find((item) => item.id === selectedCaseId);
  const { requests: disclosureRequests, refetch: refetchDisclosureRequests } = useDisclosureRequests(selectedCaseId);
  const { permissions: disclosureLog, refetch: refetchDisclosureLog } = useDisclosureLog(selectedCaseId);
  const { revealed: identityRevealed, refetch: refetchIdentityReveal } = useIdentityReveal(selectedCaseId, selectedCase?.reporter);
  const submittedCount = sortedCases.filter((item) => item.status === 0).length;
  const verifiedCount = sortedCases.filter((item) => item.status === 4).length;
  const closedCount = sortedCases.filter((item) => item.status === 5).length;

  const clearFeedback = () => {
    setNotice('');
    setError('');
  };

  const handleGrantReviewerRole = async () => {
    clearFeedback();
    if (!isValidAddress(roleAddress)) {
      setError('Enter a valid wallet address before granting reviewer role.');
      return;
    }
    try {
      await grantReviewerRole(roleAddress);
      setNotice(`Reviewer role granted to ${roleAddress}.`);
      setRoleAddress('');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to grant reviewer role.');
    }
  };

  const handleAssignReviewer = async () => {
    clearFeedback();
    if (!selectedCaseId) { setError('Choose a case first.'); return; }
    if (!isValidAddress(reviewerAddress)) { setError('Enter a valid reviewer address.'); return; }
    try {
      await assignReviewer(selectedCaseId, reviewerAddress);
      setNotice(`Reviewer assigned to case #${selectedCaseId}.`);
      setReviewerAddress('');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to assign reviewer.');
    }
  };

  const handleSetThreshold = async () => {
    clearFeedback();
    if (!selectedCaseId) { setError('Choose a case first.'); return; }
    if (threshold < 1) { setError('Threshold must be at least 1.'); return; }
    try {
      await setApprovalThreshold(selectedCaseId, threshold);
      setNotice(`Approval threshold updated for case #${selectedCaseId}.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update threshold.');
    }
  };

  const handleGrantDisclosure = async () => {
    clearFeedback();
    if (!selectedCaseId) { setError('Choose a case first.'); return; }
    if (!isValidAddress(disclosureAddress)) { setError('Enter a valid address for disclosure access.'); return; }
    try {
      await grantAccess(selectedCaseId, disclosureAddress, permissionLevel);
      await refetchDisclosureLog();
      setNotice(`Granted ${getPermissionLevelLabel(permissionLevel)} access for case #${selectedCaseId}.`);
      setDisclosureAddress('');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to grant disclosure access.');
    }
  };

  const handlePublishConfidentialTally = async () => {
    clearFeedback();
    if (!selectedCaseId) { setError('Choose a case first.'); return; }
    if (!encryptedSummaryHandles) { setError('Confidential tally handles are not ready yet.'); return; }
    if (!cofheReady) { setError('The confidential client is still connecting.'); return; }
    try {
      await authorize(selectedCaseId);
      const [approvals, rejects, escalations] = await Promise.all(
        encryptedSummaryHandles.map((handle) => decryptHandleForTx(handle))
      );
      await publishConsensus(
        selectedCaseId,
        {
          approvals: Number(approvals.decryptedValue),
          rejects: Number(rejects.decryptedValue),
          escalations: Number(escalations.decryptedValue),
          severityTotal: 0,
          averageSeverityScore: 0,
        },
        [approvals.signature, rejects.signature, escalations.signature]
      );
      setNotice(`Published the confidential tally for case #${selectedCaseId}.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to publish the confidential tally.');
    }
  };

  const handleRevokeDisclosure = async () => {
    clearFeedback();
    if (!selectedCaseId) { setError('Choose a case first.'); return; }
    if (!isValidAddress(disclosureAddress)) { setError('Enter a valid address for disclosure revocation.'); return; }
    try {
      await revokeAccess(selectedCaseId, disclosureAddress);
      await refetchDisclosureLog();
      setNotice(`Revoked disclosure access for case #${selectedCaseId}.`);
      setDisclosureAddress('');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to revoke disclosure access.');
    }
  };

  const handleUpdateStatus = async () => {
    clearFeedback();
    if (!selectedCaseId) { setError('Choose a case first.'); return; }
    try {
      await updateStatus(selectedCaseId, nextStatus);
      setNotice(`Case #${selectedCaseId} moved to ${getCaseStatusLabel(nextStatus)}.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update case status.');
    }
  };

  const handleResolveDisclosure = async (requestIndex: number, approved: boolean) => {
    clearFeedback();
    if (!selectedCaseId) { setError('Choose a case first.'); return; }
    try {
      await resolveRequest(selectedCaseId, requestIndex, approved);
      await refetchDisclosureRequests();
      setNotice(`Disclosure request ${approved ? 'approved' : 'denied'} for case #${selectedCaseId}.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to resolve disclosure request.');
    }
  };

  const handleRevealIdentity = async () => {
    clearFeedback();
    if (!selectedCase) { setError('Choose a case first.'); return; }
    try {
      await revealIdentity(selectedCase.id, selectedCase.reporter);
      await refetchIdentityReveal();
      setNotice(`Reporter identity reveal recorded for case #${selectedCase.id}.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to reveal reporter identity.');
    }
  };

  const handleComplianceExport = () => {
    clearFeedback();
    if (sortedCases.length === 0) {
      setError('No cases are available to export yet.');
      return;
    }

    downloadComplianceExport(createComplianceExportPack(sortedCases, chainId));
    setNotice('Auditor-safe compliance export generated without plaintext report content.');
  };

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-emerald-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-teal-600/10 to-transparent rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Admin</span>
            </div>
            <Link href="/reviewer/analytics" className="btn-secondary text-xs hidden sm:flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </Link>
            <Link href="/admin/dao" className="btn-secondary text-xs hidden sm:flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              DAO
            </Link>
            <Link href="/admin/timelock" className="btn-secondary text-xs hidden sm:flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              TimeLock
            </Link>
            <Link href="/admin/onboarding" className="btn-secondary text-xs hidden lg:flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3M6 15v2a2 2 0 002 2h4M6 11V7a2 2 0 012-2h8a2 2 0 012 2v1" />
              </svg>
              Onboarding
            </Link>
            <Link href="/admin/operations" className="btn-secondary text-xs hidden lg:flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
              </svg>
              Ops
            </Link>
            <ConnectButton />
          </div>
        </div>
      </nav>

      <main className="relative pt-28 pb-16 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Admin</span> Dashboard
          </h1>
          <p className="text-gray-400">
            Manage roles, route cases, and control disclosure permissions.
          </p>
        </div>

        {!isConnected ? (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Connect Admin Wallet</h2>
            <p className="text-gray-400 mb-8">Connect the admin wallet to access the admin dashboard.</p>
            <ConnectButton />
          </div>
        ) : adminLoading ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-gray-400 mt-4">Checking admin permissions...</p>
          </div>
        ) : !adminFlag ? (
          <div className="glass-card p-12 text-center border-red-500/20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Access Denied</h2>
            <p className="text-gray-400">This wallet is not an admin for the current deployment.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Total Cases</div>
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {idsLoading ? '...' : <AnimatedCounter end={sortedCases.length} />}
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Submitted</div>
                </div>
                <div className="text-3xl font-bold text-amber-400">
                  <AnimatedCounter end={submittedCount} />
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Verified</div>
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                  <AnimatedCounter end={verifiedCount} />
                </div>
              </div>
              <div className="stats-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Closed</div>
                </div>
                <div className="text-3xl font-bold text-gray-400">
                  <AnimatedCounter end={closedCount} />
                </div>
              </div>
            </div>

            {/* Alerts */}
            {notice && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {notice}
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Admin Actions */}
            <div className="grid lg:grid-cols-3 gap-6 mb-10">
              {/* Grant Reviewer Role */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Grant Reviewer Role</h3>
                    <p className="text-xs text-gray-500">Enable wallet to review cases</p>
                  </div>
                </div>
                <Input
                  value={roleAddress}
                  onChange={(e) => setRoleAddress(e.target.value)}
                  placeholder="0x reviewer address"
                  className="mb-4"
                />
                <Button onClick={handleGrantReviewerRole} loading={rolePending}>
                  Grant Reviewer Role
                </Button>
              </div>

              {/* Route Case */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Route a Case</h3>
                    <p className="text-xs text-gray-500">Assign reviewer & set threshold</p>
                  </div>
                </div>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(Number(e.target.value))}
                  className="input-modern mb-4"
                >
                  <option value={0}>Select a case...</option>
                  {caseIds.map((id) => (
                    <option key={id} value={id}>Case #{id}</option>
                  ))}
                </select>
                <Input
                  value={reviewerAddress}
                  onChange={(e) => setReviewerAddress(e.target.value)}
                  placeholder="0x reviewer address"
                  className="mb-4"
                />
                <div className="flex gap-3 mb-4">
                  <input
                    type="number"
                    min={1}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value) || 1)}
                    className="input-modern w-24"
                  />
                  <Button onClick={handleSetThreshold} variant="secondary" className="flex-1">
                    Set Threshold
                  </Button>
                </div>
                <Button onClick={handleAssignReviewer} loading={reviewerHubPending}>
                  Assign Reviewer
                </Button>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Manual Status</div>
                  <div className="flex gap-3">
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(Number(e.target.value))}
                      className="input-modern flex-1"
                    >
                      {CASE_STATUS.map((label, index) => (
                        <option key={label} value={index}>{label}</option>
                      ))}
                    </select>
                    <Button onClick={handleUpdateStatus} loading={statusPending} variant="secondary">
                      Update
                    </Button>
                  </div>
                </div>
              </div>

              {/* Disclosure Access */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Disclosure Access</h3>
                    <p className="text-xs text-gray-500">Grant permission levels</p>
                  </div>
                </div>
                <Input
                  value={disclosureAddress}
                  onChange={(e) => setDisclosureAddress(e.target.value)}
                  placeholder="0x grantee address"
                  className="mb-4"
                />
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {permissionOptions.map((level) => (
                    <button
                      key={level}
                      onClick={() => setPermissionLevel(level)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${permissionLevel === level ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                    >
                      {getPermissionLevelLabel(level)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleGrantDisclosure} loading={disclosurePending}>
                    Grant Access
                  </Button>
                  <Button onClick={handleRevokeDisclosure} loading={disclosurePending} variant="secondary">
                    Revoke
                  </Button>
                </div>
                {disclosureLog.length > 0 ? (
                  <div className="mt-5 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recent Grants</div>
                    {disclosureLog.slice(-3).reverse().map((permission, index) => (
                      <div key={`${permission.grantee}-${permission.grantedAt}-${index}`} className="rounded-lg bg-black/20 p-2 text-xs text-gray-400">
                        <span className="font-mono text-gray-300">{shortAddress(permission.grantee)}</span>
                        {' '}· {getPermissionLevelLabel(permission.level)}
                        {permission.revoked ? ' · revoked' : ''}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="glass-card p-6 mb-10">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-semibold">Disclosure Requests</h3>
                  <p className="text-xs text-gray-500">Resolve requester access and record identity reveals on-chain</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(Number(e.target.value))}
                    className="input-modern min-w-44"
                  >
                    <option value={0}>Select a case...</option>
                    {caseIds.map((id) => (
                      <option key={id} value={id}>Case #{id}</option>
                    ))}
                  </select>
                  <Button
                    onClick={handleRevealIdentity}
                    variant={identityRevealed ? 'secondary' : 'warning'}
                    disabled={!selectedCase || identityRevealed}
                    loading={disclosurePending}
                  >
                    {identityRevealed ? 'Identity Revealed' : 'Reveal Identity'}
                  </Button>
                </div>
              </div>

              {!selectedCaseId ? (
                <p className="text-sm text-gray-400">Select a case to view disclosure requests.</p>
              ) : disclosureRequests.length === 0 ? (
                <p className="text-sm text-gray-400">No disclosure requests for this case.</p>
              ) : (
                <div className="space-y-3">
                  {disclosureRequests.map((request) => (
                    <div key={request.index} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="font-mono text-sm text-gray-300">{shortAddress(request.requester)}</div>
                        <div className="text-xs text-gray-500">
                          {getPermissionLevelLabel(request.requestedLevel)} · {formatTimestamp(request.timestamp)}
                        </div>
                      </div>
                      {request.resolved ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.approved ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                          {request.approved ? 'Approved' : 'Denied'}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <Button onClick={() => handleResolveDisclosure(request.index, true)} loading={disclosurePending} variant="success">
                            Approve
                          </Button>
                          <Button onClick={() => handleResolveDisclosure(request.index, false)} loading={disclosurePending} variant="secondary">
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Publish Consensus */}
            <div className="glass-card p-6 mb-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Publish Confidential Tally</h3>
                    <p className="text-xs text-gray-500">Finalize the vote consensus for a case</p>
                  </div>
                </div>
                <Button onClick={handlePublishConfidentialTally} variant="warning" loading={authorizePending || publishPending}>
                  Publish Consensus
                </Button>
              </div>
            </div>

            {/* Cases Table */}
            <div className="glass-card overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold">All Cases</h2>
                <button
                  type="button"
                  onClick={handleComplianceExport}
                  className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m4 7H5a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2z" />
                  </svg>
                  Export Pack
                </button>
              </div>
              {idsLoading || casesLoading ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                </div>
              ) : sortedCases.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400">No cases have been submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedCases.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/reviewer/case/${item.id}`} className="text-lg font-semibold hover:text-blue-400 transition-colors">
                              #{item.id}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {getCaseCategoryLabel(item.category)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {shortAddress(item.reporter)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {item.voteCount} / {item.reviewerCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimestamp(item.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
