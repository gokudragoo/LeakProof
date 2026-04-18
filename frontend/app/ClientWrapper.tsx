'use client';

import { useState, useEffect } from 'react';
import { Providers } from './providers';
import InteractiveCanvas from '@/components/InteractiveCanvas';
import SplashScreen from '@/components/SplashScreen';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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