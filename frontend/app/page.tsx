'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import AnimatedCounter from '@/components/AnimatedCounter';
import { contractsConfigured, getCaseStatusLabel } from '@/lib/contracts';
import { useCaseRegistry, useCases } from '@/hooks/useCaseRegistry';

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Zero-Knowledge Privacy',
    description: 'Your identity is protected. Reports are encrypted on-chain with FHE technology.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'On-Chain Verification',
    description: 'Every action is verified on Ethereum. Full transparency with cryptographic proofs.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Multi-Role Access',
    description: 'Reporters, reviewers, and admins. Role-based permissions with full control.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Evidence Management',
    description: 'Upload supporting evidence to IPFS. Tamper-proof with on-chain references.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    title: 'Consensus Voting',
    description: 'Reviewers vote on reports. Consensus triggers automatic status changes.',
    color: 'from-rose-500 to-red-500',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: 'Selective Disclosure',
    description: 'Grant access at 4 levels. Full control over who sees what.',
    color: 'from-indigo-500 to-violet-500',
  },
];

const steps = [
  {
    number: '01',
    title: 'Connect Wallet',
    description: 'Connect your Ethereum wallet to get started. Your address becomes your identity.',
  },
  {
    number: '02',
    title: 'Submit Report',
    description: 'Fill out the report form. Your data is encrypted and stored on IPFS.',
  },
  {
    number: '03',
    title: 'Review Process',
    description: 'Assigned reviewers evaluate your case through secure voting.',
  },
  {
    number: '04',
    title: 'Get Resolution',
    description: 'Consensus triggers verification. Track your case status in real-time.',
  },
];

export default function Home() {
  const { isConnected } = useAccount();
  const { caseCount, isLoading } = useCaseRegistry();
  const { cases } = useCases([]);

  const verifiedCount = cases.filter((item) => item.status === 4).length;
  const activeCount = cases.filter((item) => item.status !== 5 && item.status !== 6).length;

  return (
    <main className="min-h-screen bg-[#050508] overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-grid opacity-50" />
      </div>

      {/* Navigation */}
      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xl">🔒</span>
            </div>
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="#features" className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors">
              How it Works
            </Link>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 slide-up">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-gray-300">Live on Ethereum Sepolia</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 slide-up animate-delay-100">
              <span className="gradient-text">Whistleblowing</span>
              <br />
              <span className="text-white">Reimagined</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 slide-up animate-delay-200">
              A privacy-first platform for secure reporting. Your identity protected, your voice heard.
              Built on Ethereum with zero-knowledge encryption.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 slide-up animate-delay-300">
              <Link href="/reporter/submit" className="btn-primary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Report
              </Link>
              <Link href="#how-it-works" className="btn-secondary flex items-center gap-2">
                Learn More
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto slide-up animate-delay-400">
              <div className="stats-card text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                  {isLoading ? '...' : <AnimatedCounter end={caseCount} />}
                </div>
                <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Total Cases</div>
              </div>
              <div className="stats-card text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1">
                  <AnimatedCounter end={verifiedCount} />
                </div>
                <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Verified</div>
              </div>
              <div className="stats-card text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-1">
                  <AnimatedCounter end={activeCount} />
                </div>
                <div className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="hidden lg:block absolute top-1/3 left-10 float-animation" style={{ animationDelay: '0s' }}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <div className="hidden lg:block absolute top-1/2 right-16 float-animation" style={{ animationDelay: '2s' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built with cutting-edge technology to ensure maximum security and privacy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card-hover p-6 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 mb-5`}>
                  <div className="w-full h-full rounded-2xl bg-[#0a0a10] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">How It Works</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Simple, secure, and transparent. Here&apos;s how the workflow operates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="glass-card p-6 h-full">
                  <div className="text-5xl font-black text-white/5 mb-4">{step.number}</div>
                  <h3 className="text-xl font-semibold mb-3 gradient-text-cyan">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-border-card p-12 md:p-16 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to <span className="gradient-text">Make a Difference</span>?
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto mb-10">
                Your report can change things. Every submission is encrypted, verified, and tracked on-chain.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/reporter/submit" className="btn-primary">
                  Submit Your Report
                </Link>
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <span className="text-lg font-bold gradient-text">LeakProof</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>All systems operational</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 LeakProof. Built on Ethereum.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
