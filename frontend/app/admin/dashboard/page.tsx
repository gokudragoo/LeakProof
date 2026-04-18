'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useCaseRegistry, useCaseStatus, useCase } from '@/hooks/useCaseRegistry';
import { useReviewerHub } from '@/hooks/useReviewerHub';
import { useDisclosureCtrl } from '@/hooks/useDisclosureCtrl';
import { CASE_STATUS, CASE_CATEGORY } from '@/lib/contracts';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function AdminDashboard() {
  const { isConnected, address } = useAccount();
  const { caseCount, isLoading } = useCaseRegistry();
  const { assignReviewer, isPending, isSuccess } = useReviewerHub();
  const { grantAccess } = useDisclosureCtrl();

  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [reviewerAddress, setReviewerAddress] = useState('');
  const [activeTab, setActiveTab] = useState<'cases' | 'assign'>('cases');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAssignReviewer = (caseId: number) => {
    if (reviewerAddress && reviewerAddress.startsWith('0x')) {
      assignReviewer(caseId, reviewerAddress);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setReviewerAddress('');
      setSelectedCase(null);
    }
  };

  const handleGrantAccess = (caseId: number) => {
    if (reviewerAddress && reviewerAddress.startsWith('0x')) {
      grantAccess(caseId, reviewerAddress, 2);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setReviewerAddress('');
    }
  };

  return (
    <div className="min-h-screen relative">
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xl font-bold gradient-text">LeakProof X</span>
            </Link>
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/30">
              Admin
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-8 pulse-glow">
              <svg className="w-16 h-16 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 slide-up">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8 max-w-md text-center slide-up animate-delay-100">
              Connect your wallet to access the admin dashboard and manage cases.
            </p>
            <div className="slide-up animate-delay-200">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 slide-up">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage cases, assign reviewers, and control disclosure permissions</p>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 slide-up">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Action completed successfully! Transaction is being processed.
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Total Cases', value: caseCount, color: 'primary' },
                { label: 'Submitted', value: caseCount, color: 'blue' },
                { label: 'Under Review', value: 0, color: 'purple' },
                { label: 'Verified', value: 0, color: 'emerald' },
                { label: 'Closed', value: 0, color: 'gray' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`glass rounded-2xl p-4 hover-lift transition-all duration-300 slide-up animate-delay-${(i + 1) * 50}`}
                >
                  <div className={`text-2xl font-bold ${
                    stat.color === 'primary' ? 'text-primary-400' :
                    stat.color === 'blue' ? 'text-blue-400' :
                    stat.color === 'purple' ? 'text-purple-400' :
                    stat.color === 'emerald' ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    <AnimatedCounter end={stat.value} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 slide-up animate-delay-200">
              {[
                { id: 'cases', label: 'All Cases', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'assign', label: 'Assign Reviewers', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'glass hover:bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cases List */}
            {activeTab === 'cases' && (
              <div className="glass rounded-2xl p-6 slide-up animate-delay-300">
                <h2 className="text-xl font-semibold mb-6">All Cases</h2>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : caseCount === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-dark-700/50 flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">No cases submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...Array(caseCount)].map((_, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-dark-800/50 border border-gray-800 hover:border-emerald-500/30 transition-all duration-300"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">Case #{i + 1}</div>
                            <div className="text-sm text-gray-400">
                              Category: {CASE_CATEGORY[0]} • Status: {CASE_STATUS[0]}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setSelectedCase(i + 1); setActiveTab('assign'); }}
                              className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-colors"
                            >
                              Assign Reviewer
                            </button>
                            <button
                              onClick={() => handleGrantAccess(i + 1)}
                              className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-colors"
                            >
                              Grant Access
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assign Reviewer */}
            {activeTab === 'assign' && (
              <div className="glass rounded-2xl p-6 slide-up animate-delay-300">
                <h2 className="text-xl font-semibold mb-6">Assign Reviewers</h2>

                <div className="space-y-6">
                  {[...Array(caseCount)].map((_, i) => (
                    <div key={i} className="p-5 rounded-xl bg-dark-800/50 border border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-semibold text-lg">Case #{i + 1}</div>
                          <div className="text-sm text-gray-400">
                            Category: {CASE_CATEGORY[0]}
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
                        <div className="flex gap-4 animate-slide-up">
                          <input
                            type="text"
                            value={reviewerAddress}
                            onChange={(e) => setReviewerAddress(e.target.value)}
                            placeholder="0x... (reviewer address)"
                            className="flex-1 px-4 py-3 rounded-xl bg-dark-800 border border-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors text-sm"
                          />
                          <button
                            onClick={() => handleAssignReviewer(i + 1)}
                            disabled={!reviewerAddress || !reviewerAddress.startsWith('0x')}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold transition-all disabled:cursor-not-allowed"
                          >
                            {isPending ? 'Processing...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setSelectedCase(null)}
                            className="px-4 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-gray-400 font-medium transition-colors"
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
            <div className="mt-8 grid md:grid-cols-2 gap-6 slide-up animate-delay-400">
              <div className="glass rounded-2xl p-6 hover-lift transition-all duration-300">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  Disclosure Control
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Manage who can access case details and under what conditions.
                </p>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-400 font-medium transition-colors border border-emerald-500/30">
                  Manage Permissions
                </button>
              </div>

              <div className="glass rounded-2xl p-6 hover-lift transition-all duration-300">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  Emergency Controls
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Pause reviews or activate emergency protocols if abuse is detected.
                </p>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-400 font-medium transition-colors border border-red-500/30">
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