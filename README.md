# 🔒 LeakProof X

**Privacy-First Whistleblowing Platform on Ethereum**

<p align="center">
  <img src="https://img.shields.io/badge/Network-Ethereum%20Sepolia-627EEA?style=for-the-badge&logo=ethereum" alt="Sepolia">
  <img src="https://img.shields.io/badge/Smart%20Contracts-Solidity-363636?style=for-the-badge&logo=solidity" alt="Solidity">
  <img src="https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=next.js" alt="Next.js">
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

| Role | Permissions |
|------|-------------|
| **Reporter** | Submit reports and track their own cases |
| **Reviewer** | Evaluate assigned cases and submit votes |
| **Admin** | Manage cases, assign reviewers, grant reviewer roles, control disclosure |

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

| Contract | Address | Purpose |
|----------|---------|---------|
| **AccessControl** | `0x1b69a89aCaae7d4Aebd0b1fcEE50c89bf9547F66` | Role management |
| **LeakProofCore** | `0x8CCDe2497ec6580077056d852E94752fF38A042E` | Case storage |
| **ReviewerHub** | `0x5bD964D7CfABbb2A7BdF0202880C8d5AD86C50BA` | Voting system |
| **DisclosureCtrl** | `0x599da2BbF6E94859E15B2eCD2b95f1eF1f9dCE49` | Permissions |

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
NEXT_PUBLIC_ACCESS_CONTROL=0x498A44b098eD67Ec45ca3901797366B570710bda
NEXT_PUBLIC_CORE=0xD31B4340A4A0FD0e27502B8AF5E17338678a0DdC
NEXT_PUBLIC_REVIEWER_HUB=0xB4CA8e42b612caFA23b3853Cd80d758193114d83
NEXT_PUBLIC_DISCLOSURE_CTRL=0x03755dAF0761CD385fdEE0f980ac05433211052A
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
PINATA_JWT=your_pinata_jwt
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

### Wave 3 📋 (Planned)
- [ ] Anonymous reputation system
- [ ] Time-locked disclosure
- [ ] Multi-reviewer consensus analytics
- [ ] DAO governance

### Wave 4 🔐 (Planned)
- [ ] Enterprise compliance
- [ ] Legal export
- [ ] White-label dashboard

### Wave 5 🚀 (Future)
- [ ] Layer 2 migration
- [ ] Mobile app
- [ ] Partnership integrations

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, custom animations |
| Wallet | wagmi v2, RainbowKit, viem |
| Privacy Workflow | Client-side digesting + IPFS-backed payloads |
| Storage | IPFS, Pinata |
| Contracts | Solidity, Hardhat, OpenZeppelin |
| Network | Ethereum Sepolia |

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
│   ├── contracts/        # AccessControl, LeakProofCore, ReviewerHub, DisclosureCtrl
│   ├── scripts/          # Deployment scripts
│   ├── test/             # Contract tests
│   └── .env.deployed     # Latest deployed contract addresses
├── frontend/             # Next.js 14 app
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
