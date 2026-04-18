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
  { icon: '🛡️', title: 'Zero-Knowledge Privacy', description: 'All sensitive data encrypted client-side before touching the blockchain.', color: 'primary' },
  { icon: '🔒', title: 'Confidential Contracts', description: 'Smart contracts store encrypted blobs - report content never visible.', color: 'purple' },
  { icon: '👥', title: 'Private Voting', description: 'Reviewers vote with encrypted scores. Consensus without revealing votes.', color: 'emerald' },
  { icon: '⏰', title: 'Time-Lock Disclosure', description: 'Identity reveal requires multiple approvals.', color: 'amber' },
  { icon: '📎', title: 'Encrypted Evidence', description: 'Files encrypted and stored on IPFS with on-chain CID references.', color: 'cyan' },
  { icon: '🎯', title: 'Selective Disclosure', description: 'Role-based permissions: Outcome, Summary, Full Report, or Identity Reveal.', color: 'pink' },
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
  { name: 'Financial', icon: '📊', count: 0, color: 'green' },
  { name: 'Compliance', icon: '⚖️', count: 0, color: 'cyan' },
];

export default function Home() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen relative overflow-hidden">
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 z-10">
        <div className="fixed w-96 h-96 rounded-full pointer-events-none z-0 transition-all duration-300 ease-out" style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)', left: mousePos.x - 192, top: mousePos.y - 192 }} />
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8 slide-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary-500/30 hover:border-primary-400/50 transition-all duration-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-primary-400 font-medium tracking-wide">Powered by Fhenix & Ethereum</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-sm">Sepolia Testnet</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 slide-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <span className="gradient-text">LeakProof X</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-4 slide-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>Privacy-First Whistleblowing Platform</p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12 slide-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            Secure. Confidential. On-Chain. Submit encrypted whistleblower reports with Fhenix-powered privacy.
          </p>
          <div className="flex justify-center gap-6 md:gap-12 mb-12 slide-up opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className={`text-4xl md:text-5xl font-black mb-1 ${stat.color === 'primary' ? 'text-primary-400' : stat.color === 'emerald' ? 'text-emerald-400' : 'text-purple-400'}`}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix || ''} />
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-6 slide-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
            <ConnectButton />
            {isConnected && (
              <div className="flex flex-wrap gap-4 mt-6 justify-center">
                <Link href="/reporter/dashboard" className="group px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 text-white font-semibold transition-all hover-lift flex items-center gap-2">
                  <span>🛡️</span> Reporter Dashboard
                </Link>
                <Link href="/admin/dashboard" className="group px-6 py-3 rounded-xl glass hover:bg-emerald-500/20 text-emerald-400 font-semibold transition-all hover-lift flex items-center gap-2">
                  <span>⚙️</span> Admin Panel
                </Link>
                <Link href="/reviewer/dashboard" className="group px-6 py-3 rounded-xl glass hover:bg-purple-500/20 text-purple-400 font-semibold transition-all hover-lift flex items-center gap-2">
                  <span>👁️</span> Reviewer
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 slide-up"><span className="gradient-text">Built for Privacy</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto slide-up animate-delay-100">Every feature designed with privacy as the foundation.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className={`group p-6 rounded-2xl glass hover-lift transition-all duration-500 slide-up opacity-0 ${f.color === 'primary' ? 'hover:border-primary-500/50' : f.color === 'purple' ? 'hover:border-purple-500/50' : f.color === 'emerald' ? 'hover:border-emerald-500/50' : f.color === 'amber' ? 'hover:border-amber-500/50' : f.color === 'cyan' ? 'hover:border-cyan-500/50' : 'hover:border-pink-500/50'}`} style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'forwards' }}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary-400 transition-colors">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 slide-up"><span className="gradient-text">How It Works</span></h2>
            <p className="text-gray-400 slide-up animate-delay-100">Privacy maintained at every step.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {workflow.map((item, i) => (
              <div key={item.step} className="relative text-center slide-up" style={{ animationDelay: `${(i + 1) * 150}ms`, animationFillMode: 'forwards' }}>
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl ${i === 0 ? 'bg-gradient-to-br from-primary-500 to-cyan-500' : i === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-500' : i === 2 ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-amber-500 to-orange-500'}`}>{item.icon}</div>
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-dark-800 border-2 border-primary-500 flex items-center justify-center text-xs font-bold">{item.step}</div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 slide-up"><span className="gradient-text">Report Categories</span></h2>
            <p className="text-gray-400 slide-up animate-delay-100">Submit confidentially about any incident type.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <div key={cat.name} className={`group p-4 rounded-xl glass text-center hover-lift transition-all duration-300 slide-up opacity-0 ${cat.color === 'red' ? 'hover:border-red-500/50' : cat.color === 'orange' ? 'hover:border-orange-500/50' : cat.color === 'purple' ? 'hover:border-purple-500/50' : cat.color === 'blue' ? 'hover:border-blue-500/50' : cat.color === 'green' ? 'hover:border-emerald-500/50' : 'hover:border-cyan-500/50'}`} style={{ animationDelay: `${(i + 1) * 80}ms`, animationFillMode: 'forwards' }}>
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <div className="font-medium text-sm mb-1">{cat.name}</div>
                <div className="text-xs text-gray-500">{cat.count} reports</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 text-center">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-3xl font-bold mb-4"><span className="gradient-text">Enterprise-Grade Security</span></h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Built on battle-tested smart contracts with role-based access control, encrypted storage, and comprehensive audit trails.</p>
            <div className="grid md:grid-cols-4 gap-6 text-center mb-8">
              {[{ icon: '🔒', label: 'End-to-End Encrypted' }, { icon: '✅', label: 'Verified on-Chain' }, { icon: '👁️', label: 'Zero-Knowledge Proofs' }, { icon: '🛡️', label: 'DDoS Protected' }].map((item, i) => (
                <div key={item.label} className="slide-up" style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'forwards' }}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm font-medium">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-4 py-2 rounded-full glass text-sm text-gray-400"><span className="text-emerald-400">✓</span> Smart Contract Audited</div>
              <div className="px-4 py-2 rounded-full glass text-sm text-gray-400"><span className="text-emerald-400">✓</span> OpenZeppelin Security</div>
              <div className="px-4 py-2 rounded-full glass text-sm text-gray-400"><span className="text-emerald-400">✓</span> Fhenix Confidential</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 slide-up">Ready to <span className="gradient-text">Report Safely</span>?</h2>
          <p className="text-gray-400 mb-8 slide-up animate-delay-100">Your identity protected. Your reports encrypted. Your voice heard.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 slide-up animate-delay-200">
            <Link href="/reporter/submit" className="group px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 text-white font-bold text-lg transition-all hover-lift flex items-center justify-center gap-2">
              Submit Confidential Report
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-white/5 glass relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white text-sm">🔒</div>
            <span className="font-bold gradient-text">LeakProof X</span>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span>Built with</span>
            <span className="text-primary-400 font-medium">Fhenix</span>
            <span>+</span>
            <span className="text-purple-400 font-medium">Ethereum</span>
          </div>
        </div>
        <div className="text-center mt-4 text-xs text-gray-600">© 2024 LeakProof X. Privacy-first whistleblowing platform.</div>
      </footer>
    </main>
  );
}