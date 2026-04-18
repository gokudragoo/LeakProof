'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';
import InteractiveCanvas from '@/components/InteractiveCanvas';
import SplashScreen from '@/components/SplashScreen';

export const metadata: Metadata = {
  title: 'LeakProof X | Privacy-First Whistleblowing Platform',
  description: 'Secure, confidential whistleblowing on blockchain with Fhenix privacy technology.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en">
      <body className="relative">
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          <>
            <InteractiveCanvas />
            <Providers>{children}</Providers>
          </>
        )}
      </body>
    </html>
  );
}