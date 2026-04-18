'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useCaseRegistry, useCaseStatus } from '@/hooks/useCaseRegistry';
import { useReviewerHub } from '@/hooks/useReviewerHub';
import { useDisclosureCtrl } from '@/hooks/useDisclosureCtrl';
import { CASE_STATUS, CASE_CATEGORY } from '@/lib/contracts';

export default function AdminDashboard() {
  const { isConnected, address } = useAccount();
  const { caseCount, allCases, isLoading } = useCaseRegistry();
  const { assignReviewer } = useReviewerHub();
  const { grantAccess } = useDisclosureCtrl();

  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [reviewerAddress, setReviewerAddress] = useState('');
  const [activeTab, setActiveTab] = useState<'cases' | 'assign'>('cases');

  const handleAssignReviewer = (caseId: number) => {
    if (reviewerAddress) {
      assignReviewer(caseId, reviewerAddress);
      setReviewerAddress('');
      setSelectedCase(null);
    }
  };

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
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
              Admin
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-6">Connect your wallet to access the admin dashboard and manage cases.</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage cases, assign reviewers, and control disclosure permissions</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-dark-800/50 border border-gray-800">
                <div className="text-3xl font-bold text-primary-400">{caseCount}</div>
                <div className="text-gray-400 text-sm">Total Cases</div>
              </div>
              {Object.entries(CASE_STATUS).filter(([k]) => !isNaN(Number(k))).slice(0, 4).map(([key, label]) => (
                <div key={key} className="p-4 rounded-xl bg-dark-800/50 border border-gray-800">
                  <div className="text-3xl font-bold text-gray-300">0</div>
                  <div className="text-gray-400 text-sm">{label as string}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('cases')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'cases'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white'
                }`}
              >
                All Cases
              </button>
              <button
                onClick={() => setActiveTab('assign')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === 'assign'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-dark-700 text-gray-400 hover:text-white'
                }`}
              >
                Assign Reviewers
              </button>
            </div>

            {/* Cases List */}
            {activeTab === 'cases' && (
              <div className="rounded-xl bg-dark-800/50 border border-gray-800 p-6">
                <h2 className="text-xl font-semibold mb-6">All Cases</h2>

                {isLoading ? (
                  <div className="text-center py-12 text-gray-400">Loading...</div>
                ) : caseCount === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No cases submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...Array(caseCount)].map((_, i) => (
                      <div key={i} className="p-4 rounded-lg bg-dark-700/50 border border-gray-700 flex justify-between items-center">
                        <div>
                          <div className="font-semibold">Case #{i + 1}</div>
                          <div className="text-sm text-gray-400">
                            Status: {CASE_STATUS[1 as keyof typeof CASE_STATUS] || 'Submitted'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCase(i + 1);
                              setActiveTab('assign');
                            }}
                            className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-colors"
                          >
                            Assign Reviewer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assign Reviewer */}
            {activeTab === 'assign' && (
              <div className="rounded-xl bg-dark-800/50 border border-gray-800 p-6">
                <h2 className="text-xl font-semibold mb-6">Assign Reviewers</h2>

                <div className="space-y-6">
                  {[...Array(caseCount)].map((_, i) => (
                    <div key={i} className="p-4 rounded-lg bg-dark-700/50 border border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-semibold">Case #{i + 1}</div>
                          <div className="text-sm text-gray-400">
                            Category: {CASE_CATEGORY[0 as keyof typeof CASE_CATEGORY] || 'Fraud'}
                          </div>
                        </div>
                        {selectedCase === i + 1 ? (
                          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
                            Assigning...
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedCase(i + 1)}
                            className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-colors"
                          >
                            Assign
                          </button>
                        )}
                      </div>

                      {selectedCase === i + 1 && (
                        <div className="flex gap-4">
                          <input
                            type="text"
                            value={reviewerAddress}
                            onChange={(e) => setReviewerAddress(e.target.value)}
                            placeholder="0x..."
                            className="flex-1 px-4 py-2 rounded-lg bg-dark-800 border border-gray-600 focus:border-emerald-500 outline-none"
                          />
                          <button
                            onClick={() => handleAssignReviewer(i + 1)}
                            disabled={!reviewerAddress}
                            className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white font-medium transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setSelectedCase(null)}
                            className="px-4 py-2 rounded-lg bg-dark-600 hover:bg-dark-500 text-gray-400 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {caseCount === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <p>No cases available for assignment</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Tools */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-dark-800/50 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Disclosure Control
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Manage who can access case details and under what conditions.
                </p>
                <button className="w-full py-3 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-medium transition-colors border border-emerald-500/30">
                  Manage Permissions
                </button>
              </div>

              <div className="p-6 rounded-xl bg-dark-800/50 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Emergency Controls
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Pause reviews or activate emergency protocols if abuse is detected.
                </p>
                <button className="w-full py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition-colors border border-red-500/30">
                  Emergency Actions
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}