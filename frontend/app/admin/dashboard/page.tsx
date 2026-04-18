'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import AnimatedCounter from '@/components/AnimatedCounter';
import {
  getCaseCategoryLabel,
  getCaseStatusLabel,
  getPermissionLevelLabel,
} from '@/lib/contracts';
import { fetchJsonFromIPFS } from '@/lib/pinata';
import { formatTimestamp } from '@/lib/report-utils';
import { useGrantReviewerRole, useIsAdmin } from '@/hooks/useAccessControl';
import { useAllCaseIds, useCases } from '@/hooks/useCaseRegistry';
import { useCofheClient } from '@/hooks/useCofheClient';
import { useDisclosureCtrl } from '@/hooks/useDisclosureCtrl';
import {
  useAuthorizeVoteSummaryAccess,
  useEncryptedVoteSummary,
  usePublishConsensus,
  useReviewerHub,
} from '@/hooks/useReviewerHub';
import type { ReportPayload } from '@/types';

const permissionOptions = [1, 2, 3, 4];

function isValidAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export default function AdminDashboard() {
  const { isConnected, address } = useAccount();
  const { data: adminFlag, isLoading: adminLoading } = useIsAdmin(address);
  const { caseIds, isLoading: idsLoading } = useAllCaseIds();
  const { cases, isLoading: casesLoading } = useCases(caseIds);
  const { handles: encryptedSummaryHandles } = useEncryptedVoteSummary(selectedCaseId);
  const { assignReviewer, setApprovalThreshold, isPending: reviewerHubPending } = useReviewerHub();
  const { authorize, isPending: authorizePending } = useAuthorizeVoteSummaryAccess();
  const { publishConsensus, isPending: publishPending } = usePublishConsensus();
  const { grantAccess, isPending: disclosurePending } = useDisclosureCtrl();
  const { grantReviewerRole, isPending: rolePending } = useGrantReviewerRole();
  const { decryptHandleForTx, isReady: cofheReady } = useCofheClient();

  const [reports, setReports] = useState<Record<number, ReportPayload | null>>({});
  const [selectedCaseId, setSelectedCaseId] = useState<number>(0);
  const [reviewerAddress, setReviewerAddress] = useState('');
  const [threshold, setThreshold] = useState(2);
  const [disclosureAddress, setDisclosureAddress] = useState('');
  const [permissionLevel, setPermissionLevel] = useState(2);
  const [roleAddress, setRoleAddress] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedCaseId && caseIds.length > 0) {
      setSelectedCaseId(caseIds[0]);
    }
  }, [caseIds, selectedCaseId]);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      if (cases.length === 0) {
        setReports({});
        return;
      }

      const entries = await Promise.all(
        cases.map(async (item) => {
          try {
            return [item.id, await fetchJsonFromIPFS<ReportPayload>(item.reportCid)] as const;
          } catch {
            return [item.id, null] as const;
          }
        })
      );

      if (!active) {
        return;
      }

      const nextReports: Record<number, ReportPayload | null> = {};
      for (const [caseId, payload] of entries) {
        nextReports[caseId] = payload;
      }
      setReports(nextReports);
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, [cases]);

  const sortedCases = [...cases].sort((left, right) => right.updatedAt - left.updatedAt);
  const selectedCase = sortedCases.find((item) => item.id === selectedCaseId) ?? null;
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

    if (!selectedCaseId) {
      setError('Choose a case first.');
      return;
    }

    if (!isValidAddress(reviewerAddress)) {
      setError('Enter a valid reviewer address.');
      return;
    }

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

    if (!selectedCaseId) {
      setError('Choose a case first.');
      return;
    }

    if (threshold < 1) {
      setError('Threshold must be at least 1.');
      return;
    }

    try {
      await setApprovalThreshold(selectedCaseId, threshold);
      setNotice(`Approval threshold updated for case #${selectedCaseId}.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update threshold.');
    }
  };

  const handleGrantDisclosure = async () => {
    clearFeedback();

    if (!selectedCaseId) {
      setError('Choose a case first.');
      return;
    }

    if (!isValidAddress(disclosureAddress)) {
      setError('Enter a valid address for disclosure access.');
      return;
    }

    try {
      await grantAccess(selectedCaseId, disclosureAddress, permissionLevel);
      setNotice(`Granted ${getPermissionLevelLabel(permissionLevel)} access for case #${selectedCaseId}.`);
      setDisclosureAddress('');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to grant disclosure access.');
    }
  };

  const handlePublishConfidentialTally = async () => {
    clearFeedback();

    if (!selectedCaseId || !selectedCase) {
      setError('Choose a case first.');
      return;
    }

    if (selectedCase.voteCount === 0) {
      setError('This case has no submitted reviewer votes yet.');
      return;
    }

    if (!encryptedSummaryHandles) {
      setError('Confidential tally handles are not ready yet.');
      return;
    }

    if (!cofheReady) {
      setError('The confidential client is still connecting.');
      return;
    }

    try {
      await authorize(selectedCaseId);

      const [approvals, rejects, escalations, averageSeverityScore] = await Promise.all(
        encryptedSummaryHandles.map((handle) => decryptHandleForTx(handle))
      );

      await publishConsensus(
        selectedCaseId,
        {
          approvals: Number(approvals.decryptedValue),
          rejects: Number(rejects.decryptedValue),
          escalations: Number(escalations.decryptedValue),
          averageSeverityScore: Number(averageSeverityScore.decryptedValue),
        },
        [
          approvals.signature,
          rejects.signature,
          escalations.signature,
          averageSeverityScore.signature,
        ]
      );

      setNotice(`Published the confidential tally for case #${selectedCaseId}.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to publish the confidential tally.');
    }
  };

  return (
    <div className="min-h-screen relative">
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold gradient-text">
            LeakProof X
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Admin dashboard</h1>
          <p className="text-gray-400 mt-2">Grant roles, route cases, and manage disclosure permissions.</p>
        </div>

        {!isConnected ? (
          <div className="glass rounded-3xl p-8 border border-white/10 text-center">
            Connect the admin wallet to continue.
          </div>
        ) : adminLoading ? (
          <div className="glass rounded-3xl p-8 border border-white/10 text-gray-400">
            Checking admin permissions...
          </div>
        ) : !adminFlag ? (
          <div className="glass rounded-3xl p-8 border border-red-500/20 bg-red-500/10 text-red-300">
            This wallet is not an admin for the current deployment.
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-sm text-gray-500">Total cases</div>
                <div className="text-3xl font-bold text-sky-300 mt-2">
                  {idsLoading ? '...' : <AnimatedCounter end={sortedCases.length} />}
                </div>
              </div>
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-sm text-gray-500">Submitted</div>
                <div className="text-3xl font-bold text-amber-300 mt-2">
                  <AnimatedCounter end={submittedCount} />
                </div>
              </div>
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-sm text-gray-500">Verified</div>
                <div className="text-3xl font-bold text-emerald-300 mt-2">
                  <AnimatedCounter end={verifiedCount} />
                </div>
              </div>
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="text-sm text-gray-500">Closed</div>
                <div className="text-3xl font-bold text-gray-300 mt-2">
                  <AnimatedCounter end={closedCount} />
                </div>
              </div>
            </div>

            {notice ? (
              <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200 text-sm">
                {notice}
              </div>
            ) : null}

            {error ? (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-sm">
                {error}
              </div>
            ) : null}

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="glass rounded-3xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold">Grant reviewer role</h2>
                <p className="text-sm text-gray-500 mt-2">Do this before assigning a wallet to a case.</p>
                <input
                  value={roleAddress}
                  onChange={(event) => setRoleAddress(event.target.value)}
                  placeholder="0x reviewer address"
                  className="w-full mt-5 px-4 py-4 rounded-2xl bg-slate-950/60 border border-white/10 focus:border-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleGrantReviewerRole}
                  disabled={rolePending}
                  className="w-full mt-4 py-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 disabled:opacity-60"
                >
                  {rolePending ? 'Waiting for wallet...' : 'Grant reviewer role'}
                </button>
              </div>

              <div className="glass rounded-3xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold">Route a case</h2>
                <p className="text-sm text-gray-500 mt-2">Assign a reviewer, set the approval threshold, and publish confidential tallies.</p>
                <select
                  value={selectedCaseId}
                  onChange={(event) => setSelectedCaseId(Number(event.target.value))}
                  className="w-full mt-5 px-4 py-4 rounded-2xl bg-slate-950/60 border border-white/10 focus:border-fuchsia-500 outline-none"
                >
                  {caseIds.length === 0 ? <option value={0}>No cases available</option> : null}
                  {caseIds.map((caseId) => (
                    <option key={caseId} value={caseId}>
                      Case #{caseId}
                    </option>
                  ))}
                </select>
                <input
                  value={reviewerAddress}
                  onChange={(event) => setReviewerAddress(event.target.value)}
                  placeholder="0x reviewer address"
                  className="w-full mt-4 px-4 py-4 rounded-2xl bg-slate-950/60 border border-white/10 focus:border-fuchsia-500 outline-none"
                />
                <div className="grid grid-cols-[1fr_auto] gap-3 mt-4">
                  <input
                    type="number"
                    min={1}
                    value={threshold}
                    onChange={(event) => setThreshold(Number(event.target.value) || 1)}
                    className="px-4 py-4 rounded-2xl bg-slate-950/60 border border-white/10 focus:border-fuchsia-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSetThreshold}
                    disabled={reviewerHubPending}
                    className="px-4 py-4 rounded-2xl bg-white/5 border border-white/10 disabled:opacity-60"
                  >
                    Save threshold
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAssignReviewer}
                  disabled={reviewerHubPending}
                  className="w-full mt-4 py-4 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/20 text-fuchsia-300 disabled:opacity-60"
                >
                  {reviewerHubPending ? 'Waiting for wallet...' : 'Assign reviewer'}
                </button>
                <button
                  type="button"
                  onClick={handlePublishConfidentialTally}
                  disabled={authorizePending || publishPending || !cofheReady}
                  className="w-full mt-4 py-4 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-300 disabled:opacity-60"
                >
                  {authorizePending || publishPending
                    ? 'Publishing tally...'
                    : !cofheReady
                      ? 'Connecting confidential client...'
                      : 'Publish confidential tally'}
                </button>
              </div>

              <div className="glass rounded-3xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold">Disclosure access</h2>
                <p className="text-sm text-gray-500 mt-2">Grant a specific permission level for a case.</p>
                <input
                  value={disclosureAddress}
                  onChange={(event) => setDisclosureAddress(event.target.value)}
                  placeholder="0x grantee address"
                  className="w-full mt-5 px-4 py-4 rounded-2xl bg-slate-950/60 border border-white/10 focus:border-sky-500 outline-none"
                />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {permissionOptions.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPermissionLevel(level)}
                      className={`px-4 py-3 rounded-2xl border text-sm ${permissionLevel === level ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-white/10 bg-slate-950/40'}`}
                    >
                      {getPermissionLevelLabel(level)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleGrantDisclosure}
                  disabled={disclosurePending}
                  className="w-full mt-4 py-4 rounded-2xl bg-sky-500/15 border border-sky-500/20 text-sky-300 disabled:opacity-60"
                >
                  {disclosurePending ? 'Waiting for wallet...' : 'Grant disclosure access'}
                </button>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold mb-6">All cases</h2>
              {idsLoading || casesLoading ? (
                <div className="text-gray-400">Loading case inventory...</div>
              ) : sortedCases.length === 0 ? (
                <div className="rounded-2xl bg-slate-950/50 border border-white/10 p-6 text-gray-400">
                  No cases have been submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCases.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-950/50 border border-white/10 p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold">
                            {reports[item.id]?.title || `Case #${item.id}`}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {getCaseCategoryLabel(item.category)} | {getCaseStatusLabel(item.status)}
                          </div>
                          <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                            {reports[item.id]?.description || 'Unable to load the report payload from IPFS.'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-400 space-y-2 min-w-[200px]">
                          <div>Reporter: {item.reporter}</div>
                          <div>Created: {formatTimestamp(item.createdAt)}</div>
                          <div>Votes: {item.voteCount}</div>
                          <div>Reviewers: {item.reviewerCount}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
