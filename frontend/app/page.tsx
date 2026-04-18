'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import AnimatedCounter from '@/components/AnimatedCounter';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo Badge */}
          <div className="mb-8 slide-up">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary-500/10 border border-primary-500/30 hover-lift backdrop-blur-sm transition-all duration-300">
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <span className="text-primary-400 font-medium tracking-wide">Privacy-First Platform</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 slide-up animate-delay-100">
            <span className="gradient-text">LeakProof X</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-4 slide-up animate-delay-200">
            Secure. Confidential. On-Chain.
          </p>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12 slide-up animate-delay-300">
            Submit encrypted whistleblower reports, undergo confidential case review, and maintain complete privacy with Fhenix-powered blockchain technology.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-16 mb-12 slide-up animate-delay-300">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                <AnimatedCounter end={100} suffix="%" prefix="" />
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">Encrypted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                <AnimatedCounter end={0} suffix="K" prefix="" />
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">Reports</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                <AnimatedCounter end={100} suffix="%" prefix="" />
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">On-Chain</div>
            </div>
          </div>

          {/* Connect Button */}
          <div className="flex flex-col items-center gap-6 slide-up animate-delay-400">
            <ConnectButton />

            {isConnected && (
              <div className="flex flex-wrap gap-4 mt-6 justify-center">
                <Link
                  href="/reporter/dashboard"
                  className="group px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 text-white font-semibold transition-all duration-300 hover-lift pulse-glow flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Reporter Dashboard
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/reviewer/dashboard"
                  className="group px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold transition-all duration-300 hover-lift flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Reviewer Dashboard
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="group px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold transition-all duration-300 hover-lift flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Dashboard
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 slide-up">
            <span className="gradient-text">Privacy by Design</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="group p-6 md:p-8 rounded-2xl glass hover-lift transition-all duration-500 slide-up animate-delay-100">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Encrypted Reports</h3>
              <p className="text-gray-400 leading-relaxed">
                All sensitive data encrypted client-side before touching the blockchain. No plaintext exposure.
              </p>
              <div className="mt-6 flex items-center gap-2 text-primary-400 text-sm font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 md:p-8 rounded-2xl glass hover-lift transition-all duration-500 slide-up animate-delay-200">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Private Review</h3>
              <p className="text-gray-400 leading-relaxed">
                Confidential reviewer voting with encrypted scores. No public disclosure until authorized.
              </p>
              <div className="mt-6 flex items-center gap-2 text-purple-400 text-sm font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 md:p-8 rounded-2xl glass hover-lift transition-all duration-500 slide-up animate-delay-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Selective Disclosure</h3>
              <p className="text-gray-400 leading-relaxed">
                Only authorized parties can access specific data. Full control over what gets revealed.
              </p>
              <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 slide-up">
            <span className="gradient-text">How It Works</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { step: 1, title: 'Connect', desc: 'Secure wallet access', color: 'primary' },
              { step: 2, title: 'Submit', desc: 'Encrypted on-chain', color: 'purple' },
              { step: 3, title: 'Review', desc: 'Private evaluation', color: 'emerald' },
              { step: 4, title: 'Reveal', desc: 'Controlled disclosure', color: 'amber' },
            ].map((item, index) => (
              <div key={item.step} className={`text-center slide-up animate-delay-${(index + 1) * 100}`}>
                <div
                  className={`
                    w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center
                    ${item.color === 'primary' ? 'bg-gradient-to-br from-primary-500 to-cyan-500' : ''}
                    ${item.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : ''}
                    ${item.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : ''}
                    ${item.color === 'amber' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : ''}
                    pulse-glow group-hover:scale-110 transition-transform duration-300
                  `}
                >
                  <span className="text-3xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Connection Lines */}
          <div className="hidden md:flex justify-between items-center px-12 mt-4">
            <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
            <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5 relative z-10 glass">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>Built with</span>
            <span className="text-primary-400 font-medium">Fhenix</span>
            <span>&</span>
            <span className="text-purple-400 font-medium">Ethereum</span>
            <span>Privacy Technology</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  );
}