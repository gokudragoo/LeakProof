# 🔒 LeakProof X

**Privacy-First Whistleblowing Platform on Ethereum**

<p align="center">
  <img src="https://img.shields.io/badge/Network-Ethereum%20Sepolia-627EEA?style=for-the-badge&logo=ethereum" alt="Sepolia">
  <img src="https://img.shields.io/badge/Smart%20Contracts-Solidity-363636?style=for-the-badge&logo=solidity" alt="Solidity">
  <img src="https://img.shields.io/badge/Frontend-Next.js%2016-000000?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Workflow-On--Chain-16a34a?style=for-the-badge" alt="On-chain">
</p>

---

## 🎯 What is LeakProof X?

LeakProof X is a **working on-chain whistleblowing and compliance reporting platform** built on Ethereum Sepolia. It enables secure, confidential reporting with protected report payloads, reviewer voting, and selective disclosure.

**Live URL**: [https://leakproof-gamma.vercel.app](https://leakproof-gamma.vercel.app)

---

## ✨ Features

### 🔐 Privacy by Design

- Client-side protected report payloads before on-chain anchoring
- Report and evidence references stored on-chain with IPFS CIDs and digests
- Zero plaintext report body stored directly in contract state
- Wallet address as pseudonymous identifier
- Receipt-confirmed submission and voting flow

### 👥 Role-Based Access

| Role         | Permissions                                                              |
| ------------ | ------------------------------------------------------------------------ |
| **Reporter** | Submit reports and track their own cases                                 |
| **Reviewer** | Evaluate assigned cases and submit votes                                 |
| **Admin**    | Manage cases, assign reviewers, grant reviewer roles, control disclosure |

### 🗳️ Private Voting

- Reviewer votes stored on-chain
- Consensus engine triggers automatic verification or rejection
- Approve / Reject / Escalate flow
- Severity scoring per reviewer

### 🔓 Selective Disclosure

- **4 Permission levels**: OutcomeOnly / SummaryOnly / FullReport / IdentityReveal
- Admin-controlled disclosure access
- Full audit trail on-chain

### 📎 Evidence Management

- IPFS integration (Pinata) for file storage
- On-chain CID references for tamper evidence
- Drag & drop file uploads

---

## 📍 Deployed Contracts (Sepolia Testnet)

| Contract                 | Address                                      | Purpose                         |
| ------------------------ | -------------------------------------------- | ------------------------------- |
| **AccessControl**        | `0x11CA5A395E958Da09FA3A536083D130AE70F0899` | Role management                 |
| **LeakProofCore**        | `0xAda01070cd7bFA4Deb06651d17bC8DCa5340256c` | Case storage                    |
| **ReviewerHub**          | `0x5E1D2cF60BE742924540A6B776D437251e0EE53F` | FHE reviewer voting             |
| **DisclosureCtrl**       | `0x08D462652Cc4517220c275a45F1289B6F42efAA6` | Selective permissions           |
| **LeakProofToken**       | `0xEF4E82bC002A7e68592F00c809E896368c9E32c3` | Governance voting power         |
| **ReputationRegistry**   | `0xA1F21077C218095C7c511f558ac7754B1CA43805` | Reporter/reviewer reputation    |
| **TimeLockedDisclosure** | `0x9587ce13587A8D38aE446a25073b0aBdF0bC1Fd5` | Time-locked disclosure controls |
| **LeakProofDAO**         | `0xbad25115cA45D516b42b1Bdc924397064419268e` | DAO proposals and voting        |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev --workspace frontend

# Open http://localhost:3000
```

### Configuration (`frontend/.env.local`)

```env
NEXT_PUBLIC_ACCESS_CONTROL=0x11CA5A395E958Da09FA3A536083D130AE70F0899
NEXT_PUBLIC_CORE=0xAda01070cd7bFA4Deb06651d17bC8DCa5340256c
NEXT_PUBLIC_REVIEWER_HUB=0x5E1D2cF60BE742924540A6B776D437251e0EE53F
NEXT_PUBLIC_DISCLOSURE_CTRL=0x08D462652Cc4517220c275a45F1289B6F42efAA6
NEXT_PUBLIC_TOKEN=0xEF4E82bC002A7e68592F00c809E896368c9E32c3
NEXT_PUBLIC_REPUTATION=0xA1F21077C218095C7c511f558ac7754B1CA43805
NEXT_PUBLIC_TIMELOCKED=0x9587ce13587A8D38aE446a25073b0aBdF0bC1Fd5
NEXT_PUBLIC_DAO=0xbad25115cA45D516b42b1Bdc924397064419268e
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
PINATA_JWT=your_pinata_jwt
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
```

### Deployment Configuration (`.env`)

```env
SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=
```

---

## 🗺️ Roadmap

### Wave 1 ✅ (Completed)

- [x] Smart contracts deployed to Sepolia
- [x] Role-based access control
- [x] Reviewer assignment & voting
- [x] Frontend with wallet connect
- [x] IPFS integration
- [x] Splash screen & animations
- [x] Interactive canvas particles
- [x] Real dashboards connected to on-chain data
- [x] Receipt-confirmed report submission and voting

### Wave 2 ✅ (Completed)

- [x] CoFHE SDK for true FHE encryption
- [x] ZK-proof generation
- [x] Real-time event updates
- [x] Enhanced dashboards
- [x] End-to-end on-chain workflow

### Wave 3 ✅ (Completed)

- [x] Anonymous reputation system
- [x] Multi-reviewer consensus analytics
- [x] DAO governance token and proposal flow
- [x] CoFHE package upgrade to 0.5.x

### Wave 4 ✅ (Completed)

- [x] Time-locked disclosure controls
- [x] Multi-admin unlock approvals
- [x] Emergency disclosure pause
- [x] Production UI hardening and deployment wiring
- [x] Operations health dashboard for deployed contract bytecode checks
- [x] Final Sepolia end-to-end smoke test

### Wave 5 🚀 (Launch Hardening)

- [x] Independent audit package and smart contract threat model
- [x] Contract verification checklist, release manifest script, and immutable Sepolia deployment manifest
- [x] CI pipeline for compile, frontend build, audit reporting, manifest generation, and optional Sepolia smoke tests
- [x] Production observability: RPC health endpoint, bytecode checks, failed transaction tracking, uptime-ready `/api/health`
- [x] Event indexer for fast case, vote, assignment, and status history in Operations
- [x] Organization onboarding: admin setup wizard, reviewer invite flow, and role recovery runbook
- [x] Secure key management: multisig admin ownership, deployer key rotation, reviewer recovery, and emergency response policy
- [x] L2 deployment plan for lower fees, with bridge and chain-switch UX policy
- [x] PWA/mobile-ready reporter experience with encrypted offline drafts
- [x] Compliance export packs for auditors without exposing confidential report content

---

## 🏗️ Tech Stack

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Frontend         | Next.js 16, React 18, TypeScript                                      |
| Styling          | Tailwind CSS, custom animations                                       |
| Wallet           | wagmi v2, RainbowKit, viem                                            |
| Privacy Workflow | CoFHE encrypted inputs + client-side digesting + IPFS-backed payloads |
| Storage          | IPFS, Pinata                                                          |
| Contracts        | Solidity 0.8.28, Hardhat, OpenZeppelin, CoFHE                         |
| Network          | Ethereum Sepolia                                                      |

---

## 📱 How It Works

### Reporter

1. Connect wallet → Dashboard
2. Submit report payload → Transaction on-chain
3. Receive real Case ID from confirmed receipt → Track privately

### Reviewer

1. Admin assigns to case
2. Submit vote (`approve` / `reject` / `escalate`)
3. Consensus updates the case status on-chain

### Admin

1. View all cases
2. Grant reviewer role
3. Assign reviewers
4. Grant disclosure permissions

---

## 🎨 UI Features

- Splash screen with loading animation
- Interactive canvas with mouse particles
- Glassmorphism cards
- Animated counters
- Drag & drop file uploads
- Gradient text animations
- Hover effects
- Dark theme

---

## 📂 Project Structure

```text
leakproof/
├── contracts/            # Solidity smart contracts
│   ├── contracts/        # Core, reviewer, disclosure, reputation, timelock, DAO
│   ├── scripts/          # Deployment scripts
│   ├── test/             # Contract tests
│   └── .env.deployed     # Latest deployed Sepolia addresses
├── frontend/             # Next.js 16 app
│   ├── app/              # Pages (landing, dashboards, submit)
│   ├── components/       # SplashScreen, InteractiveCanvas, AnimatedCounter
│   ├── hooks/            # useCaseRegistry, useReviewerHub, useDisclosureCtrl
│   └── lib/              # wagmi, contracts, cofhe, pinata
├── .env.example
├── frontend/.env.example
└── README.md
```

---

## ✅ Validation

Latest verified checks:

- `npm run compile --workspace contracts`
- `npm run test --workspace contracts`
- `npm run build --workspace frontend`
- `npm run audit:report`
- `npm run manifest --workspace contracts`
- `npm run check:deployment --workspace contracts`

Latest Sepolia smoke test on the Wave 5 deployment created case `#1`, assigned the deployer as reviewer, submitted an encrypted vote, published the CoFHE-backed tally, and finalized the case as Verified.

---

## 🤝 Contributing

Open PRs welcome! See `CONTRIBUTING.md` for guidelines.

## 📄 License

MIT License

## 🙏 Built With

- [OpenZeppelin](https://openzeppelin.com) — Smart contract libraries
- [RainbowKit](https://rainbow.me) — Wallet connect
- [Pinata](https://pinata.cloud) — IPFS uploads
- [Wavehack](https://wavehack.io) — Hackathon

---

**Built for privacy-first whistleblowing**  
🔒 Your voice, protected.
