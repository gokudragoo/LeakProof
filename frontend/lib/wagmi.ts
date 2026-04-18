import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';

const isServer = typeof window === 'undefined';

export const config = isServer
  ? createConfig({
      chains: [sepolia],
      transports: {
        [sepolia.id]: http('https://ethereum-sepolia.publicnode.com'),
      },
    })
  : getDefaultConfig({
      appName: 'LeakProof X',
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
      chains: [sepolia, mainnet],
      ssr: true,
      transports: {
        [sepolia.id]: http('https://ethereum-sepolia.publicnode.com'),
        [mainnet.id]: http('https://eth.llamarpc.com'),
      },
    });

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}