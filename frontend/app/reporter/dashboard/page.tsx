'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useCaseRegistry, useCase } from '@/hooks/useCaseRegistry';
import { useUserRole } from '@/hooks/useAccessControl';
import { CASE_STATUS, CASE_CATEGORY } from '@/lib/contracts';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function ReporterDashboard() {
  const { isConnected, address } = useAccount();
  const { caseCount, isLoading } = useCaseRegistry();
  const userRole = useUserRole(address);

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xl font-bold gradient-text">LeakProof X</span>
            </Link>
            <span className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium border border-blue-500/30">
              Reporter
            </span>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 flex items-center justify-center mb-8 pulse-glow">
              <svg className="w-16 h-16 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 slide-up">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8 max-w-md text-center slide-up animate-delay-100">
              Connect your wallet to access the reporter dashboard and submit confidential reports.
            </p>
            <div className="slide-up animate-delay-200">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="mb-8 slide-up">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Reporter Dashboard</h1>
              <p className="text-gray-400">Submit and track your confidential reports</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass rounded-2xl p-6 hover-lift transition-all duration-300 slide-up animate-delay-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-bold gradient-text">
                      <AnimatedCounter end={caseCount} />
                    </div>
                    <div className="text-sm text-gray-500">Total Reports</div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 hover-lift transition-all duration-300 slide-up animate-delay-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400">
                      <AnimatedCounter end={caseCount > 0 ? 1 : 0} />
                    </div>
                    <div className="text-sm text-gray-500">Under Review</div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 hover-lift transition-all duration-300 slide-up animate-delay-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-400">
                      <AnimatedCounter end={0} />
                    </div>
                    <div className="text-sm text-gray-500">Resolved</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Link
                href="/reporter/submit"
                className="group p-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30 hover:border-primary-500/60 transition-all hover-lift duration-500 slide-up animate-delay-200"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Submit New Report</h3>
                <p className="text-gray-400 text-sm">Create an encrypted confidential report</p>
                <div className="mt-4 flex items-center gap-2 text-primary-400 text-sm font-medium">
                  <span>Get started</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              <div className="group p-6 rounded-2xl glass hover-lift transition-all duration-500 slide-up animate-delay-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 opacity-50">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">My Reports</h3>
                <p className="text-gray-400 text-sm">Track the status of your submitted reports</p>
              </div>

              <div className="group p-6 rounded-2xl glass hover-lift transition-all duration-500 slide-up animate-delay-400">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 opacity-50">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Privacy Info</h3>
                <p className="text-gray-400 text-sm">Learn how your data is protected</p>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="glass rounded-2xl p-6 slide-up animate-delay-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your Reports</h2>
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : caseCount === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl bg-dark-700/50 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-2">No reports submitted yet</p>
                  <p className="text-sm text-gray-500 mb-6">Submit your first confidential report to get started</p>
                  <Link
                    href="/reporter/submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 text-white font-semibold transition-all hover-lift"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit Report
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...Array(caseCount)].map((_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-dark-800/50 border border-gray-800 hover:border-primary-500/30 transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold group-hover:text-primary-400 transition-colors">
                            Case #{i + 1}
                          </div>
                          <div className="text-sm text-gray-400">
                            Status: <span className="text-blue-400">{CASE_STATUS[0]}</span> • Category: {CASE_CATEGORY[0]}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                            Submitted
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-primary-500/10 to-cyan-500/10 border border-primary-500/20 slide-up animate-delay-400">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-primary-400 mb-1">Privacy Protection</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Your report data is encrypted client-side before being stored on the blockchain. Only you and authorized reviewers can access the content. Your wallet address serves as your anonymous identifier.
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