'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Providers } from './providers';
import SplashScreen from '@/components/SplashScreen';

const InteractiveCanvas = dynamic(() => import('@/components/InteractiveCanvas'), {
  ssr: false,
});

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <>
          <InteractiveCanvas />
          <Providers>{children}</Providers>
        </>
      )}
    </>
  );
}