'use client';

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { CofheProvider } from '@cofhe/react';
import { createCofheClient, createCofheConfig } from '@cofhe/sdk/web';
import { sepolia } from '@cofhe/sdk/chains';
import '@rainbow-me/rainbowkit/styles.css';
import { useMemo } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LeakProofTheme = darkTheme({
  accentColor: '#0ea5e9',
  accentColorForeground: 'white',
  borderRadius: 'medium',
});

function CofheSetup({ children }: { children: React.ReactNode }) {
  const cofheConfig = useMemo(
    () =>
      createCofheConfig({
        environment: 'web',
        supportedChains: [sepolia],
        useWorkers: true,
        mocks: {
          decryptDelay: 0,
          encryptDelay: [100, 100, 100, 500, 500],
        },
      }),
    []
  );

  const cofheClient = useMemo(() => createCofheClient(cofheConfig), [cofheConfig]);

  return (
    <CofheProvider queryClient={queryClient} cofheClient={cofheClient} config={cofheConfig}>
      {children}
    </CofheProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={LeakProofTheme}
          modalSize="compact"
          coolMode={false}
          initialChain={11155111}
        >
          <CofheSetup>{children}</CofheSetup>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}