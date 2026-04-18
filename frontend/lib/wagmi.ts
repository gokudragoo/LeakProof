import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";

export const config = getDefaultConfig({
  appName: "LeakProof X",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo-project-id",
  chains: [sepolia],
  ssr: true,
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
