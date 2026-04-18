'use client';

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { CofheProvider, createCofheReact } from '@cofhe/react';
import '@rainbow-me/rainbowkit/styles.css';

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

const { cofheClient, cofheConfig } = createCofheReact({
  react: {
    shareablePermits: true,
    enableShieldUnshield: false,
    autogeneratePermits: true,
    defaultPermitExpirationSeconds: 60 * 60 * 24 * 30,
  },
});

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
          <CofheProvider
            queryClient={queryClient}
            cofheClient={cofheClient}
            config={cofheConfig}
          >
            {children}
          </CofheProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { cofheClient, cofheConfig };
