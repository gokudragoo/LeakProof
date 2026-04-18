'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const steps = [
      { progress: 20, status: 'Loading wallet providers...' },
      { progress: 40, status: 'Connecting to Sepolia...' },
      { progress: 60, status: 'Loading contracts...' },
      { progress: 80, status: 'Initializing encryption...' },
      { progress: 100, status: 'Ready!' },
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress);
        setStatus(steps[currentStep].status);
        currentStep++;

        if (currentStep >= steps.length) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 via-cyan-500 to-emerald-500 p-1 animate-pulse">
            <div className="w-full h-full rounded-xl bg-dark-900 flex items-center justify-center">
              <span className="text-4xl">🔒</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black mb-2">
          <span className="gradient-text">LeakProof X</span>
        </h1>
        <p className="text-gray-400 mb-12">Privacy-First Whistleblowing Platform</p>

        {/* Progress bar */}
        <div className="w-64 mx-auto mb-4">
          <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <p className="text-sm text-gray-500">{status}</p>

        {/* Network badge */}
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-400">Ethereum Sepolia</span>
        </div>
      </div>
    </div>
  );
}