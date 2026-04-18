'use client';

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { CofheProvider, createCofheConfig, createCofheClient } from '@cofhe/react';
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
  const { cofheConfig, cofheClient } = useMemo(() => {
    const config = createCofheConfig({
      environment: 'web',
      supportedChains: [{ id: 11155111, name: 'Sepolia', network: 'sepolia', coFheUrl: 'https://testnet-cofhe.fhenix.zone', verifierUrl: 'https://testnet-cofhe-vrf.fhenix.zone', thresholdNetworkUrl: 'https://testnet-cofhe-tn.fhenix.zone', environment: 'TESTNET' }],
      useWorkers: true,
      mocks: { decryptDelay: 0, encryptDelay: [100, 100, 100, 500, 500] },
      react: {
        shareablePermits: true,
        enableShieldUnshield: false,
        autogeneratePermits: true,
        defaultPermitExpirationSeconds: 60 * 60 * 24 * 30,
      },
    });
    const client = createCofheClient(config);
    return { cofheConfig: config, cofheClient: client };
  }, []);

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
        <RainbowKitProvider theme={LeakProofTheme} modalSize="compact" coolMode={false} initialChain={11155111}>
          <CofheSetup>{children}</CofheSetup>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}