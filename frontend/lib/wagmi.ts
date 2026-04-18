import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'LeakProof X',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo',
  chains: [sepolia, mainnet],
  ssr: true,
  transports: {
    [sepolia.id]: 'https://ethereum-sepolia.publicnode.com',
    [mainnet.id]: 'https://eth.llamarpc.com',
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}