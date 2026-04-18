# 🔒 LeakProof X

**Privacy-First Whistleblowing Platform on Ethereum**

<p align="center">
  <img src="https://img.shields.io/badge/Network-Ethereum%20Sepolia-627EEA?style=for-the-badge&logo=ethereum" alt="Sepolia">
  <img src="https://img.shields.io/badge/Smart%20Contracts-Solidity-363636?style=for-the-badge&logo=solidity" alt="Solidity">
  <img src="https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=next.js" alt="Next.js">
</p>

---

## 🎯 What is LeakProof X?

LeakProof X is a **production-ready**, **fully on-chain** whistleblowing and compliance reporting platform built on Ethereum Sepolia. It enables secure, confidential reporting with encrypted smart contracts, private reviewer voting, and selective disclosure — privacy is an **architectural primitive**, not just a feature.

---

## ✨ Features

### 🔐 Privacy by Design
- Client-side AES encryption of all sensitive data before on-chain storage
- Encrypted smart contracts store reports as encrypted blobs
- Zero plaintext exposure in public transactions
- Wallet address as pseudonymous identifier

### 👥 Role-Based Access
| Role | Permissions |
|------|------------|
| **Reporter** | Submit encrypted reports (open to all) |
| **Reviewer** | Evaluate assigned cases with encrypted voting |
| **Admin** | Manage cases, assign reviewers, control disclosure |

### 🗳️ Private Voting
- Encrypted reviewer votes stored on-chain
- Consensus engine triggers automatic verification
- Anonymous severity scoring

### 🔓 Selective Disclosure
- **4 Permission levels**: OutcomeOnly / SummaryOnly / FullReport / IdentityReveal
- Time-locked identity reveal
- Full audit trail on-chain

### 📎 Evidence Management
- IPFS integration for encrypted file storage
- On-chain CID references for tamper evidence
- Drag & drop file uploads

---

## 📍 Deployed Contracts (Sepolia Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **AccessControl** | `0xcce613271DCBac6aF3CF4eBf53E4C992d6D8ef69` | Role management |
| **LeakProofCore** | `0x857dfb28574F58a67e7334a33EA7a00263Df9797` | Case storage |
| **ReviewerHub** | `0x9D0c1dbbAF2E4849c27B88f8E8DA165D764ffB1b` | Voting system |
| **DisclosureCtrl** | `0xB2078Aae5782788CA551A8212E27901233260E23` | Permissions |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development
cd frontend && npm install && npm run dev

# Open http://localhost:3000
```

### Configuration (.env.local)
```env
NEXT_PUBLIC_ACCESS_CONTROL=0xcce613271DCBac6aF3CF4eBf53E4C992d6D8ef69
NEXT_PUBLIC_CORE=0x857dfb28574F58a67e7334a33EA7a00263Df9797
NEXT_PUBLIC_REVIEWER_HUB=0x9D0c1dbbAF2E4849c27B88f8E8DA165D764ffB1b
NEXT_PUBLIC_DISCLOSURE_CTRL=0xB2078Aae5782788CA551A8212E27901233260E23
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
```

---

## 🗺️ Roadmap

### Wave 1 ✅ (Completed)
- [x] Smart contracts deployed to Sepolia
- [x] Client-side encryption
- [x] Role-based access control
- [x] Reviewer assignment & voting
- [x] Frontend with wallet connect
- [x] IPFS integration
- [x] Splash screen & animations
- [x] Interactive canvas particles

### Wave 2 🔄 (In Progress)
- [ ] CoFHE SDK for true FHE encryption
- [ ] ZK-proof generation
- [ ] Real-time event updates
- [ ] Enhanced dashboards

### Wave 3 📋 (Planned)
- [ ] Anonymous reputation system
- [ ] Time-locked disclosure
- [ ] Multi-reviewer consensus
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
| Privacy | CoFHE SDK (Fhenix), client-side AES |
| Storage | IPFS, Pinata |
| Contracts | Solidity, Hardhat, OpenZeppelin |
| Network | Ethereum Sepolia |

---

## 📱 How It Works

### Reporter
1. Connect wallet → Dashboard
2. Submit encrypted report → Transaction on-chain
3. Receive Case ID → Track privately

### Reviewer
1. Admin assigns to case
2. Submit encrypted vote (approve/reject/escalate)
3. Consensus triggers verification

### Admin
1. View all cases
2. Assign reviewers
3. Grant disclosure permissions

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
```
leakproof/
├── contracts/           # Solidity smart contracts
│   └── contracts/       # AccessControl, LeakProofCore, ReviewerHub, DisclosureCtrl
├── frontend/            # Next.js 14 app
│   ├── app/            # Pages (landing, dashboards, submit)
│   ├── components/      # SplashScreen, InteractiveCanvas, AnimatedCounter
│   ├── hooks/           # useCaseRegistry, useReviewerHub, useDisclosureCtrl
│   └── lib/             # wagmi, contracts, cofhe, pinata
├── .env.local           # Environment config
├── contracts.env         # Deployment addresses
└── README.md
```

---

## 🤝 Contributing
Open PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License
MIT License

## 🙏 Built With
- [Fhenix](https://fhenix.io) — Confidential compute
- [OpenZeppelin](https://openzeppelin.com) — Smart contract libraries
- [RainbowKit](https://rainbow.me) — Wallet connect
- [Wavehack](https://wavehack.io) — Hackathon

---

<p align="center">
  <strong>Built for privacy-first whistleblowing</strong>
  <br>
  🔒 Your voice, protected.
</p>