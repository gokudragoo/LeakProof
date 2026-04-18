# LeakProof X - Privacy-First Whistleblowing Platform

Built for Wavehack Hackathon on Fhenix.

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Wallet**: wagmi v2 + RainbowKit + viem
- **Chain**: Ethereum Sepolia
- **Privacy**: CoFHE SDK for client-side encryption
- **Storage**: Pinata IPFS for encrypted evidence
- **Contracts**: Hardhat + Solidity (OpenZeppelin)

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - Get from cloud.walletconnect.com
- `NEXT_PUBLIC_PINATA_JWT` - Get from pinata.cloud
- `SEPOLIA_RPC_URL` - Sepolia RPC URL
- `PRIVATE_KEY` - Deployer wallet private key

### 3. Deploy Contracts

```bash
cd contracts
yarn deploy
```

### 4. Start Frontend

```bash
cd frontend
yarn dev
```

## Project Structure

```
leakproof/
├── contracts/           # Solidity smart contracts
│   ├── contracts/       # Contract source files
│   │   ├── AccessControl.sol
│   │   ├── LeakProofCore.sol
│   │   ├── ReviewerHub.sol
│   │   └── DisclosureController.sol
│   ├── scripts/         # Deployment scripts
│   └── hardhat.config.ts
├── frontend/            # Next.js application
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── hooks/           # wagmi contract hooks
│   ├── lib/             # Utilities (wagmi, cofhe, pinata)
│   └── types/           # TypeScript types
└── .env.example         # Environment template
```

## Features

- **Wallet Connect**: RainbowKit integration for seamless onboarding
- **Encrypted Reports**: Client-side encryption before on-chain storage
- **Private Review**: Encrypted voting for reviewers
- **Selective Disclosure**: Role-based access control
- **IPFS Evidence**: Encrypted file storage with on-chain references

## Privacy Model

1. All sensitive data encrypted client-side before touching blockchain
2. Contracts store encrypted blobs - no plaintext exposed
3. CoFHE SDK handles decryption for authorized viewers
4. Role-based access enforced at contract and UI level

## Workflow

1. **Reporter** → Submit encrypted report with optional evidence
2. **Admin** → Assign reviewers to cases
3. **Reviewer** → Evaluate and submit encrypted votes
4. **Consensus** → Automatic status update when threshold met
5. **Disclosure** → Admin grants access to authorized parties

## Contract Addresses

After deployment, update `.env.local` with the deployed contract addresses:
- `NEXT_PUBLIC_ACCESS_CONTROL`
- `NEXT_PUBLIC_CORE`
- `NEXT_PUBLIC_REVIEWER_HUB`
- `NEXT_PUBLIC_DISCLOSURE_CTRL`

## Resources

- [CoFHE Documentation](https://cofhe-docs.fhenix.zone/)
- [wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://www.rainbowkit.com)
- [Pinata Documentation](https://docs.pinata.cloud)

## License

MIT