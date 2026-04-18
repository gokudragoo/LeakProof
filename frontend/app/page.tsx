'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary-500/10 border border-primary-500/20">
              <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-primary-400 font-medium">Privacy-First Platform</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">LeakProof X</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-4">
            Secure. Confidential. On-Chain.
          </p>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
            Submit encrypted whistleblower reports, undergo confidential case review, and maintain complete privacy with Fhenix-powered blockchain technology.
          </p>

          {/* Connect Button */}
          <div className="flex flex-col items-center gap-4">
            <ConnectButton />

            {isConnected && (
              <div className="flex gap-4 mt-6">
                <Link
                  href="/reporter/dashboard"
                  className="px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                >
                  Reporter Dashboard
                </Link>
                <Link
                  href="/reviewer/dashboard"
                  className="px-6 py-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-medium transition-colors border border-purple-500/30"
                >
                  Reviewer Dashboard
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="px-6 py-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-medium transition-colors border border-emerald-500/30"
                >
                  Admin Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-dark-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="gradient-text">Privacy by Design</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-dark-700/50 border border-gray-800">
              <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Encrypted Reports</h3>
              <p className="text-gray-400">
                All sensitive data encrypted client-side before touching the blockchain. No plaintext exposure.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-dark-700/50 border border-gray-800">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Private Review</h3>
              <p className="text-gray-400">
                Confidential reviewer voting with encrypted scores. No public disclosure until authorized.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-dark-700/50 border border-gray-800">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Selective Disclosure</h3>
              <p className="text-gray-400">
                Only authorized parties can access specific data. Full control over what gets revealed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="gradient-text">How It Works</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4 pulse-glow">
                <span className="text-2xl font-bold text-primary-400">1</span>
              </div>
              <h3 className="font-semibold mb-2">Connect Wallet</h3>
              <p className="text-sm text-gray-400">Secure access with your crypto wallet</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4 pulse-glow">
                <span className="text-2xl font-bold text-purple-400">2</span>
              </div>
              <h3 className="font-semibold mb-2">Submit Report</h3>
              <p className="text-sm text-gray-400">Encrypted data stored on-chain</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 pulse-glow">
                <span className="text-2xl font-bold text-emerald-400">3</span>
              </div>
              <h3 className="font-semibold mb-2">Private Review</h3>
              <p className="text-sm text-gray-400">Reviewers evaluate confidentially</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4 pulse-glow">
                <span className="text-2xl font-bold text-amber-400">4</span>
              </div>
              <h3 className="font-semibold mb-2">Selective Reveal</h3>
              <p className="text-sm text-gray-400">Controlled disclosure when needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            Built with Fhenix Privacy Technology
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-300 transition-colors">Docs</a>
            <a href="#" className="hover:text-gray-300 transition-colors">GitHub</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  );
}