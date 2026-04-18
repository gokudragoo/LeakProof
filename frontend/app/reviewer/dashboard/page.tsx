'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useAssignedCases } from '@/hooks/useReviewerHub';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function ReviewerDashboard() {
  const { isConnected, address } = useAccount();
  const { assignedCases, isLoading } = useAssignedCases(address);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative">
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-lg">👁️</span>
            </div>
            <span className="text-xl font-bold gradient-text">LeakProof X</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium border border-purple-500/30">
              Reviewer
            </span>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20 slide-up">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-8 pulse-glow">
              <span className="text-6xl">🛡️</span>
            </div>
            <h1 className="text-3xl font-bold mb-4 gradient-text">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8 max-w-md text-center">
              Connect your wallet to access the reviewer dashboard and evaluate cases.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="mb-8 slide-up">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Reviewer Dashboard</h1>
              <p className="text-gray-400">Evaluate assigned cases and submit confidential reviews</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Assigned Cases', value: assignedCases.length, color: 'primary' },
                { label: 'Pending Reviews', value: assignedCases.length, color: 'purple' },
                { label: 'Completed', value: 0, color: 'emerald' },
                { label: 'Escalated', value: 0, color: 'amber' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`glass rounded-2xl p-5 hover-lift transition-all duration-300 slide-up animate-delay-${(i + 1) * 100}`}
                >
                  <div className={`text-3xl font-bold ${
                    stat.color === 'primary' ? 'text-primary-400' :
                    stat.color === 'purple' ? 'text-purple-400' :
                    stat.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    <AnimatedCounter end={stat.value} />
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Assigned Cases */}
            <div className="glass rounded-2xl p-6 slide-up animate-delay-200">
              <h2 className="text-xl font-semibold mb-6">Assigned Cases</h2>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : assignedCases.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl bg-dark-700/50 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📋</span>
                  </div>
                  <p className="text-gray-400 mb-2">No cases assigned yet</p>
                  <p className="text-sm text-gray-500">Cases will appear here when assigned by an admin</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedCases.map((caseId) => (
                    <div
                      key={caseId}
                      className="p-4 rounded-xl bg-dark-800/50 border border-gray-800 hover:border-purple-500/30 transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold group-hover:text-purple-400 transition-colors">
                            Case #{caseId}
                          </div>
                          <div className="text-sm text-gray-400">
                            Click to review this case
                          </div>
                        </div>
                        <Link
                          href={`/reviewer/case/${caseId}`}
                          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <span>👁️</span>
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 slide-up animate-delay-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">🔒</span>
                </div>
                <div>
                  <h3 className="font-semibold text-purple-400 mb-1">Confidential Review</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    All review votes are encrypted and stored on-chain. Your identity and vote remain
                    confidential unless disclosure is authorized by the admin.
                  </p>
                </div>
              </div>
            </div>

            {/* Voting Guide */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {[
                { icon: '✅', label: 'Approve', desc: 'Evidence supports report', color: 'emerald' },
                { icon: '❌', label: 'Reject', desc: 'Insufficient evidence', color: 'red' },
                { icon: '⚠️', label: 'Escalate', desc: 'Needs senior review', color: 'amber' },
              ].map((action) => (
                <div
                  key={action.label}
                  className={`glass rounded-2xl p-5 text-center hover-lift transition-all duration-300 slide-up animate-delay-400 ${
                    action.color === 'emerald' ? 'hover:border-emerald-500/50' :
                    action.color === 'red' ? 'hover:border-red-500/50' : 'hover:border-amber-500/50'
                  }`}
                >
                  <div className="text-3xl mb-3">{action.icon}</div>
                  <div className="font-semibold mb-1">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}