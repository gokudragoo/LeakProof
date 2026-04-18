'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import SplashScreen from '@/components/SplashScreen';

const InteractiveCanvas = dynamic(() => import('@/components/InteractiveCanvas'), {
  ssr: false,
});

const Providers = dynamic(
  () => import('./providers').then((module) => module.Providers),
  {
    ssr: false,
  }
);

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Providers>
      <InteractiveCanvas />
      {children}
      {showSplash ? <SplashScreen onComplete={() => setShowSplash(false)} /> : null}
    </Providers>
  );
}
