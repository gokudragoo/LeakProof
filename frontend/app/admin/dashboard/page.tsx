'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useCaseRegistry } from '@/hooks/useCaseRegistry';
import { useReviewerHub } from '@/hooks/useReviewerHub';
import { useDisclosureCtrl } from '@/hooks/useDisclosureCtrl';
import { CASE_STATUS, CASE_CATEGORY } from '@/lib/contracts';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function AdminDashboard() {
  const { isConnected, address } = useAccount();
  const { caseCount, isLoading } = useCaseRegistry();
  const { assignReviewer, isPending, isSuccess } = useReviewerHub();
  const { grantAccess } = useDisclosureCtrl();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [reviewerAddress, setReviewerAddress] = useState('');
  const [activeTab, setActiveTab] = useState<'cases' | 'reviewers' | 'permissions'>('cases');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAssignReviewer = (caseId: number) => {
    if (reviewerAddress && reviewerAddress.startsWith('0x') && reviewerAddress.length === 42) {
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
    }
  };

  return (
    <div className="min-h-screen relative">
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <span className="text-white text-lg">⚙️</span>
            </div>
            <span className="text-xl font-bold gradient-text">LeakProof X</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium border border-emerald-500/30">
              Admin
            </span>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20 slide-up">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-8 pulse-glow">
              <span className="text-6xl">👑</span>
            </div>
            <h1 className="text-3xl font-bold mb-4 gradient-text">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8 max-w-md text-center">
              Connect your wallet to access the admin dashboard and manage cases.
            </p>
            <ConnectButton />
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
                <span className="text-xl">✅</span>
                Action completed successfully! Transaction is being processed.
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Total Cases', value: caseCount, color: 'primary' },
                { label: 'Submitted', value: caseCount, color: 'blue' },
                { label: 'In Review', value: 0, color: 'purple' },
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
                    {isLoading ? '...' : <AnimatedCounter end={stat.value} />}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 slide-up animate-delay-200">
              {[
                { id: 'cases', label: 'All Cases', icon: '📋' },
                { id: 'reviewers', label: 'Assign Reviewers', icon: '👥' },
                { id: 'permissions', label: 'Permissions', icon: '🔑' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'glass hover:bg-dark-700 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cases Tab */}
            {activeTab === 'cases' && (
              <div className="glass rounded-2xl p-6 slide-up animate-delay-100">
                <h2 className="text-xl font-semibold mb-6">All Cases</h2>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : caseCount === 0 ? (
                  <div className="text-center py-16">
                    <span className="text-5xl mb-4 block">📭</span>
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
                              Category: {CASE_CATEGORY[0 as keyof typeof CASE_CATEGORY]} • Reporter: 0x...{address?.slice(-4)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setSelectedCase(i + 1); setActiveTab('reviewers'); }}
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

            {/* Reviewers Tab */}
            {activeTab === 'reviewers' && (
              <div className="glass rounded-2xl p-6 slide-up animate-delay-100">
                <h2 className="text-xl font-semibold mb-6">Assign Reviewers</h2>

                <div className="space-y-6">
                  {[...Array(caseCount)].map((_, i) => (
                    <div key={i} className="p-5 rounded-xl bg-dark-800/50 border border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-semibold text-lg">Case #{i + 1}</div>
                          <div className="text-sm text-gray-400">
                            Category: {CASE_CATEGORY[0 as keyof typeof CASE_CATEGORY]}
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
                            disabled={!reviewerAddress || !reviewerAddress.startsWith('0x') || reviewerAddress.length !== 42}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold transition-all disabled:cursor-not-allowed"
                          >
                            {isPending ? 'Processing...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setSelectedCase(null)}
                            className="px-4 py-3 rounded-xl glass hover:bg-dark-600 text-gray-400 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {caseCount === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <span className="text-4xl mb-4 block">📭</span>
                      <p>No cases available for assignment</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div className="glass rounded-2xl p-6 slide-up animate-delay-100">
                <h2 className="text-xl font-semibold mb-6">Disclosure Permissions</h2>

                <div className="p-6 rounded-xl bg-dark-800/50 border border-gray-700 mb-6">
                  <h3 className="font-medium mb-4">Permission Levels</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { level: 1, name: 'Outcome Only', desc: 'Can see final decision', color: 'blue' },
                      { level: 2, name: 'Summary Only', desc: 'Can see case summary', color: 'purple' },
                      { level: 3, name: 'Full Report', desc: 'Can see all details', color: 'amber' },
                      { level: 4, name: 'Identity Reveal', desc: 'Can reveal reporter', color: 'red' },
                    ].map((perm) => (
                      <div key={perm.level} className={`p-4 rounded-xl border ${
                        perm.color === 'blue' ? 'border-blue-500/30 bg-blue-500/10' :
                        perm.color === 'purple' ? 'border-purple-500/30 bg-purple-500/10' :
                        perm.color === 'amber' ? 'border-amber-500/30 bg-amber-500/10' :
                        'border-red-500/30 bg-red-500/10'
                      }`}>
                        <div className="text-sm font-semibold">{perm.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{perm.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center py-8 text-gray-400">
                  <span className="text-4xl mb-4 block">🔐</span>
                  <p>Grant permissions from the All Cases tab</p>
                </div>
              </div>
            )}

            {/* Admin Tools */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="glass rounded-2xl p-6 hover-lift transition-all duration-300 slide-up animate-delay-400">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <span className="text-lg">🔐</span>
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

              <div className="glass rounded-2xl p-6 hover-lift transition-all duration-300 slide-up animate-delay-500">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <span className="text-lg">⚠️</span>
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