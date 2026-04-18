'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import AnimatedCounter from '@/components/AnimatedCounter';

const stats = [
  { label: 'Total Reports', value: 0, color: 'primary' },
  { label: 'Resolved Cases', value: 0, color: 'emerald' },
  { label: 'On-Chain Privacy', value: 100, suffix: '%', color: 'purple' },
];

const features = [
  {
    icon: '🛡️',
    title: 'Zero-Knowledge Privacy',
    description: 'All sensitive data encrypted client-side before touching the blockchain. No plaintext exposure, ever.',
    color: 'primary',
  },
  {
    icon: '🔒',
    title: 'Confidential Contracts',
    description: 'Smart contracts store encrypted blobs - report content never visible in public transactions.',
    color: 'purple',
  },
  {
    icon: '👥',
    title: 'Private Voting',
    description: 'Reviewers vote with encrypted scores. Consensus reached without revealing individual votes.',
    color: 'emerald',
  },
  {
    icon: '⏰',
    title: 'Time-Lock Disclosure',
    description: 'Identity reveal requires multiple approvals. Emergency override available for critical cases.',
    color: 'amber',
  },
  {
    icon: '📎',
    title: 'Encrypted Evidence',
    description: 'Files encrypted and stored on IPFS. Only CID reference stored on-chain for tamper evidence.',
    color: 'cyan',
  },
  {
    icon: '🎯',
    title: 'Selective Disclosure',
    description: 'Role-based permissions: Outcome Only, Summary Only, Full Report, or Identity Reveal.',
    color: 'pink',
  },
];

const workflow = [
  { step: 1, title: 'Connect Wallet', desc: 'Secure access with Web3', icon: '🔑' },
  { step: 2, title: 'Submit Report', desc: 'Encrypted data on-chain', icon: '📝' },
  { step: 3, title: 'Review Cases', desc: 'Private evaluation', icon: '👁️' },
  { step: 4, title: 'Reveal Safely', desc: 'Controlled disclosure', icon: '🔓' },
];

const categories = [
  { name: 'Fraud', icon: '💰', count: 0, color: 'red' },
  { name: 'Harassment', icon: '⚠️', count: 0, color: 'orange' },
  { name: 'Corruption', icon: '🏛️', count: 0, color: 'purple' },
  { name: 'Policy Violation', icon: '📋', count: 0, color: 'blue' },
  { name: 'Financial Misconduct', icon: '📊', count: 0, color: 'green' },
  { name: 'Compliance Breach', icon: '⚖️', count: 0, color: 'cyan' },
];

export default function Home() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 z-10">
        {/* Mouse follower glow */}
        <div
          className="fixed w-96 h-96 rounded-full pointer-events-none z-0 transition-all duration-300 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
            left: mousePos.x - 192,
            top: mousePos.y - 192,
            transform: 'scale(1)',
          }}
        />

        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-8 slide-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary-500/30 hover:border-primary-400/50 transition-all duration-300 hover:scale-105">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-primary-400 font-medium tracking-wide">Powered by Fhenix & Ethereum</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-sm">Sepolia Testnet</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 slide-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <span className="gradient-text">LeakProof X</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-4 slide-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            Privacy-First Whistleblowing Platform
          </p>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12 slide-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            Secure. Confidential. On-Chain. Submit encrypted whistleblower reports,
            undergo private case review, and maintain complete privacy with Fhenix-powered technology.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-6 md:gap-12 mb-12 slide-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center group">
                <div className={`text-4xl md:text-5xl font-black mb-1 ${
                  stat.color === 'primary' ? 'text-primary-400' :
                  stat.color === 'emerald' ? 'text-emerald-400' : 'text-purple-400'
                }`}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix || ''} />
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider group-hover:text-gray-300 transition-colors">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-6 slide-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
            <ConnectButton />

            {isConnected && (
              <div className="flex flex-wrap gap-4 mt-6 justify-center">
                <Link
                  href="/reporter/dashboard"
                  className="group px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 text-white font-semibold transition-all duration-300 hover-lift pulse-glow flex items-center gap-2"
                >
                  <span>🛡️</span>
                  Reporter Dashboard
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="group px-6 py-3 rounded-xl glass hover:bg-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 font-semibold transition-all duration-300 hover-lift flex items-center gap-2"
                >
                  <span>⚙️</span>
                  Admin Panel
                </Link>
              </div>
            )}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 slide-up">
              <span className="gradient-text">Built for Privacy</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto slide-up animate-delay-100">
              Every feature designed with privacy as the foundation, not an afterthought.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`group p-6 rounded-2xl glass hover-lift transition-all duration-500 slide-up opacity-0 ${
                  feature.color === 'primary' ? 'hover:border-primary-500/50' :
                  feature.color === 'purple' ? 'hover:border-purple-500/50' :
                  feature.color === 'emerald' ? 'hover:border-emerald-500/50' :
                  feature.color === 'amber' ? 'hover:border-amber-500/50' :
                  feature.color === 'cyan' ? 'hover:border-cyan-500/50' :
                  'hover:border-pink-500/50'
                }`}
                style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 slide-up">
              <span className="gradient-text">How It Works</span>
            </h2>
            <p className="text-gray-400 slide-up animate-delay-100">
              From report submission to resolution, privacy maintained at every step.
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500/30 to-transparent -translate-y-1/2" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
              {workflow.map((item, i) => (
                <div key={item.step} className="relative text-center slide-up" style={{ animationDelay: `${(i + 1) * 150}ms`, animationFillMode: 'forwards' }}>
                  <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl ${
                    i === 0 ? 'bg-gradient-to-br from-primary-500 to-cyan-500' :
                    i === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                    i === 2 ? 'bg-gradient-to-br from-emerald-500 to-teal-500' :
                    'bg-gradient-to-br from-amber-500 to-orange-500'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-dark-800 border-2 border-primary-500 flex items-center justify-center text-xs font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 slide-up">
              <span className="gradient-text">Report Categories</span>
            </h2>
            <p className="text-gray-400 slide-up animate-delay-100">
              Submit confidentially about any of these incident types.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <div
                key={cat.name}
                className={`group p-4 rounded-xl glass text-center hover-lift transition-all duration-300 slide-up opacity-0 ${
                  cat.color === 'red' ? 'hover:border-red-500/50' :
                  cat.color === 'orange' ? 'hover:border-orange-500/50' :
                  cat.color === 'purple' ? 'hover:border-purple-500/50' :
                  cat.color === 'blue' ? 'hover:border-blue-500/50' :
                  cat.color === 'green' ? 'hover:border-emerald-500/50' :
                  'hover:border-cyan-500/50'
                }`}
                style={{ animationDelay: `${(i + 1) * 80}ms`, animationFillMode: 'forwards' }}
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <div className="font-medium text-sm mb-1">{cat.name}</div>
                <div className="text-xs text-gray-500">{cat.count} reports</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 text-center">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-3xl font-bold mb-4">
              <span className="gradient-text">Enterprise-Grade Security</span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Built on battle-tested smart contracts with role-based access control,
              encrypted storage, and comprehensive audit trails. Your whistleblowers'
              identities and reports remain protected at every level.
            </p>

            <div className="grid md:grid-cols-4 gap-6 text-center mb-8">
              {[
                { icon: '🔒', label: 'End-to-End Encrypted' },
                { icon: '✅', label: 'Verified on-Chain' },
                { icon: '👁️', label: 'Zero-Knowledge Proofs' },
                { icon: '🛡️', label: 'DDoS Protected' },
              ].map((item, i) => (
                <div key={item.label} className="slide-up" style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'forwards' }}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm font-medium">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-4 py-2 rounded-full glass text-sm text-gray-400">
                <span className="text-emerald-400">✓</span> Smart Contract Audited
              </div>
              <div className="px-4 py-2 rounded-full glass text-sm text-gray-400">
                <span className="text-emerald-400">✓</span> OpenZeppelin Security
              </div>
              <div className="px-4 py-2 rounded-full glass text-sm text-gray-400">
                <span className="text-emerald-400">✓</span> Fhenix Confidential Compute
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 slide-up">
            Ready to <span className="gradient-text">Report Safely</span>?
          </h2>
          <p className="text-gray-400 mb-8 slide-up animate-delay-100">
            Your identity protected. Your reports encrypted. Your voice heard.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 slide-up animate-delay-200">
            <Link
              href="/reporter/submit"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 text-white font-bold text-lg transition-all duration-300 hover-lift pulse-glow flex items-center justify-center gap-2"
            >
              Submit Confidential Report
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="https://docs.leakproof.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl glass hover:bg-dark-700 text-gray-300 font-semibold text-lg transition-all duration-300 hover-lift flex items-center justify-center gap-2"
            >
              Read Documentation
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5 glass relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white text-sm">
              🔒
            </div>
            <span className="font-bold gradient-text">LeakProof X</span>
          </div>

          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span>Built with</span>
            <span className="text-primary-400 font-medium">Fhenix</span>
            <span>+</span>
            <span className="text-purple-400 font-medium">Ethereum</span>
            <span>+</span>
            <span className="text-emerald-400 font-medium">Next.js</span>
          </div>

          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-gray-600">
          © 2024 LeakProof X. Privacy-first whistleblowing platform. All rights reserved.
        </div>
      </footer>
    </main>
  );
}