'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function ReviewerDashboard() {
  const { isConnected, address } = useAccount();

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="border-b border-gray-800 bg-dark-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xl font-bold gradient-text">LeakProof X</span>
            </Link>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
              Reviewer
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-6">Connect your wallet to access the reviewer dashboard and evaluate cases.</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Reviewer Dashboard</h1>
              <p className="text-gray-400">Evaluate assigned cases and submit confidential reviews</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-dark-800/50 border border-gray-800">
                <div className="text-3xl font-bold text-primary-400">0</div>
                <div className="text-gray-400 text-sm">Assigned Cases</div>
              </div>
              <div className="p-4 rounded-xl bg-dark-800/50 border border-gray-800">
                <div className="text-3xl font-bold text-purple-400">0</div>
                <div className="text-gray-400 text-sm">Pending Reviews</div>
              </div>
              <div className="p-4 rounded-xl bg-dark-800/50 border border-gray-800">
                <div className="text-3xl font-bold text-emerald-400">0</div>
                <div className="text-gray-400 text-sm">Completed</div>
              </div>
              <div className="p-4 rounded-xl bg-dark-800/50 border border-gray-800">
                <div className="text-3xl font-bold text-amber-400">0</div>
                <div className="text-gray-400 text-sm">Escalated</div>
              </div>
            </div>

            {/* Assigned Cases */}
            <div className="rounded-xl bg-dark-800/50 border border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-6">Assigned Cases</h2>

              <div className="text-center py-12 text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p>No cases assigned yet</p>
                <p className="text-sm mt-2">Cases will appear here when assigned by an admin</p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="mt-8 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-purple-400 mb-1">Confidential Review</h3>
                  <p className="text-sm text-gray-400">
                    All review votes are encrypted and stored on-chain. Your identity and vote remain confidential unless disclosure is authorized by the admin.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}