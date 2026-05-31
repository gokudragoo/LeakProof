# L2 Deployment Plan

## Target Networks

- Primary: Ethereum Sepolia
- Candidate L2 testnets: Base Sepolia and Arbitrum Sepolia

## Readiness Steps

1. Confirm CoFHE contract/library support on the target L2.
2. Deploy the same Wave 5 contract set with the deployment script.
3. Generate a chain-specific immutable deployment manifest.
4. Add chain-specific `NEXT_PUBLIC_*` contract environment variables.
5. Add the chain to wagmi/RainbowKit only after bytecode checks pass.
6. Add bridge/custody instructions for governance tokens and admin multisig funds.
7. Run the Sepolia smoke flow equivalent on the L2.

## UX Rules

- Show a network as available only when every required contract has bytecode.
- Keep confidential report submission disabled on unsupported chains.
- Surface bridge links from Operations after multisig approval.

