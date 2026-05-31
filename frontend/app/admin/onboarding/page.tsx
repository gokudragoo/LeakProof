'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Logo from '@/components/Logo';
import {
  useAdminRecoveryActions,
  useGrantReviewerRole,
  useIsAdmin,
} from '@/hooks/useAccessControl';

function isValidAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="btn-primary inline-flex w-full items-center justify-center px-5 py-3 text-sm disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export default function AdminOnboardingPage() {
  const { address, isConnected } = useAccount();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(address);
  const { grantReviewerRole, isPending: reviewerPending } = useGrantReviewerRole();
  const {
    rotateDefaultAdmin,
    revokeDefaultAdminRole,
    recoverReviewerRole,
    isPending: recoveryPending,
  } = useAdminRecoveryActions();

  const [multisigAddress, setMultisigAddress] = useState('');
  const [reviewerAddress, setReviewerAddress] = useState('');
  const [compromisedReviewer, setCompromisedReviewer] = useState('');
  const [replacementReviewer, setReplacementReviewer] = useState('');
  const [oldAdminAddress, setOldAdminAddress] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    setNotice('');
    setError('');
    try {
      await action();
      setNotice(success);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed.');
    }
  };

  const setupMultisig = () => {
    if (!isValidAddress(multisigAddress)) {
      setError('Enter a valid multisig wallet address.');
      return;
    }

    void runAction(
      async () => {
        if (!address) {
          throw new Error('Connected admin wallet unavailable.');
        }
        await rotateDefaultAdmin(multisigAddress, address);
      },
      'Multisig custody activated and the connected admin was revoked.'
    );
  };

  const inviteReviewer = () => {
    if (!isValidAddress(reviewerAddress)) {
      setError('Enter a valid reviewer wallet address.');
      return;
    }

    void runAction(
      () => grantReviewerRole(reviewerAddress),
      'Reviewer invited and granted reviewer authority.'
    );
  };

  const recoverReviewer = () => {
    if (!isValidAddress(compromisedReviewer) || !isValidAddress(replacementReviewer)) {
      setError('Enter valid compromised and replacement reviewer addresses.');
      return;
    }

    void runAction(
      () => recoverReviewerRole(compromisedReviewer, replacementReviewer),
      'Reviewer role recovered on-chain.'
    );
  };

  const revokeOldAdmin = () => {
    if (!isValidAddress(oldAdminAddress)) {
      setError('Enter a valid admin address to revoke.');
      return;
    }

    void runAction(
      () => revokeDefaultAdminRole(oldAdminAddress),
      'Old admin authority revoked.'
    );
  };

  const disabled = reviewerPending || recoveryPending;

  return (
    <div className="min-h-screen bg-[#050508]">
      <nav className="navbar-glass fixed left-0 right-0 top-0 z-50 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-10 w-10" />
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <ConnectButton />
        </div>
      </nav>

      <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-28">
        <Link href="/admin/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to admin dashboard
        </Link>

        <div className="mb-10">
          <h1 className="mb-3 text-4xl font-bold md:text-5xl">
            <span className="gradient-text">Organization</span> Onboarding
          </h1>
          <p className="max-w-3xl text-gray-400">
            Set up admin custody, invite reviewers, and recover roles through on-chain controls.
          </p>
        </div>

        {!isConnected ? (
          <div className="glass-card p-12 text-center">
            <h2 className="mb-3 text-2xl font-bold">Connect Admin Wallet</h2>
            <p className="mb-8 text-gray-400">Connect a wallet with admin authority to continue.</p>
            <ConnectButton />
          </div>
        ) : adminLoading ? (
          <div className="glass-card p-12 text-center text-gray-400">Checking admin permissions...</div>
        ) : !isAdmin ? (
          <div className="glass-card border-red-500/20 p-12 text-center">
            <h2 className="mb-3 text-2xl font-bold">Access Denied</h2>
            <p className="text-gray-400">This wallet is not an admin for the current deployment.</p>
          </div>
        ) : (
          <>
            {(notice || error) && (
              <div className={`mb-6 rounded-lg border p-4 text-sm ${
                notice
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/20 bg-red-500/10 text-red-300'
              }`}>
                {notice || error}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="glass-card p-6">
                <h2 className="mb-2 text-xl font-semibold">Admin Custody</h2>
                <p className="mb-5 text-sm text-gray-500">Grant multisig authority and revoke the connected admin in the same on-chain rotation.</p>
                <input
                  value={multisigAddress}
                  onChange={(event) => setMultisigAddress(event.target.value)}
                  placeholder="0x multisig admin address"
                  className="input-modern mb-4"
                />
                <ActionButton disabled={disabled} onClick={setupMultisig}>Rotate to Multisig</ActionButton>
              </section>

              <section className="glass-card p-6">
                <h2 className="mb-2 text-xl font-semibold">Reviewer Invite</h2>
                <p className="mb-5 text-sm text-gray-500">Invite a reviewer wallet with on-chain reviewer permissions.</p>
                <input
                  value={reviewerAddress}
                  onChange={(event) => setReviewerAddress(event.target.value)}
                  placeholder="0x reviewer address"
                  className="input-modern mb-4"
                />
                <ActionButton disabled={disabled} onClick={inviteReviewer}>Grant Reviewer Role</ActionButton>
              </section>

              <section className="glass-card p-6">
                <h2 className="mb-2 text-xl font-semibold">Reviewer Recovery</h2>
                <p className="mb-5 text-sm text-gray-500">Remove a compromised reviewer and grant the replacement in one transaction.</p>
                <input
                  value={compromisedReviewer}
                  onChange={(event) => setCompromisedReviewer(event.target.value)}
                  placeholder="0x compromised reviewer"
                  className="input-modern mb-3"
                />
                <input
                  value={replacementReviewer}
                  onChange={(event) => setReplacementReviewer(event.target.value)}
                  placeholder="0x replacement reviewer"
                  className="input-modern mb-4"
                />
                <ActionButton disabled={disabled} onClick={recoverReviewer}>Recover Reviewer</ActionButton>
              </section>

              <section className="glass-card p-6">
                <h2 className="mb-2 text-xl font-semibold">Deployer Rotation</h2>
                <p className="mb-5 text-sm text-gray-500">After the multisig confirms custody, revoke the old default admin.</p>
                <input
                  value={oldAdminAddress}
                  onChange={(event) => setOldAdminAddress(event.target.value)}
                  placeholder="0x old admin address"
                  className="input-modern mb-4"
                />
                <ActionButton disabled={disabled} onClick={revokeOldAdmin}>Revoke Old Admin</ActionButton>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
