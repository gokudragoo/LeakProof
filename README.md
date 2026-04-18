# 🔒 LeakProof X

**Privacy-First Whistleblowing Platform on Ethereum**

<p align="center">
  <img src="https://img.shields.io/badge/Network-Ethereum%20Sepolia-627EEA?style=for-the-badge&logo=ethereum" alt="Sepolia">
  <img src="https://img.shields.io/badge/Smart%20Contracts-Solidity-363636?style=for-the-badge&logo=solidity" alt="Solidity">
  <img src="https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Privacy-Fhenix%20CoFHE-FF6B6B?style=for-the-badge" alt="Fhenix">
</p>

---

## 🎯 What is LeakProof X?

LeakProof X is a **production-ready**, **fully on-chain** whistleblowing and compliance reporting platform built on Ethereum Sepolia. It enables secure, confidential reporting with encrypted smart contracts, private reviewer voting, and selective disclosure.

Unlike traditional whistleblowing platforms where backend operators can access your data, LeakProof X ensures privacy is an **architectural primitive** — not just a feature.

---

## ✨ Key Features

### 🔐 Privacy by Design
- **Client-side encryption** — All sensitive data encrypted before touching the blockchain
- **Encrypted smart contracts** — Report content stored as encrypted blobs on-chain
- **Zero plaintext exposure** — No sensitive data visible in public transactions
- **Anonymous by default** — Wallet address as pseudonymous identifier

### 👥 Role-Based Access
| Role | Permissions |
|------|------------|
| **Reporter** | Anyone can submit reports (open to all) |
| **Reviewer** | Evaluate assigned cases with encrypted voting |
| **Admin** | Manage cases, assign reviewers, control disclosure |

### 🗳️ Private Voting
- **Encrypted votes** — Reviewer votes encrypted on-chain
- **Consensus engine** — Automatic status updates when threshold met
- **Anonymous scoring** — Severity and credibility scores remain confidential

### 🔓 Selective Disclosure
- **4 Permission levels** — OutcomeOnly, SummaryOnly, FullReport, IdentityReveal
- **Time-locked reveal** — Conditional identity release
- **Audit trail** — All permission changes logged on-chain

### 📎 Evidence Management
- **IPFS integration** — Encrypted file storage via Pinata
- **On-chain references** — Evidence CIDs stored in contracts
- **Tamper-evident** — Verifiable proof of evidence submission

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (Next.js 14)                      │
│  ┌──────────┐  ┌───────────┐  ┌────────┐  ┌────────────┐  │
│  │ Reporter │  │ Reviewer  │  │ Admin  │  │   IPFS    │  │
│  │Dashboard │  │ Dashboard │  │Panel   │  │  Gateway   │  │
│  └────┬─────┘  └─────┬────┘  └───┬────┘  └─────┬──────┘  │
└───────┼──────────────┼──────────┼─────────┼─────────────┘
        │              │          │         │
┌───────┴──────────────┴──────────┴─────────┴─────────────┐
│                 Smart Contracts (Ethereum Sepolia)    │
│                                                          │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │AccessControl │  │ LeakProofCore  │  │ ReviewerHub  │  │
│  │              │  │                │  │              │  │
│  │ • Roles      │  │ • Cases        │  │ • Assignment │  │
│  │ • Permissions│  │ • Status       │  │ • Voting     │  │
│  └───────────────┘  └────────────────┘  └──────────────┘  │
│  ┌──────────────────────┐  ┌───────────────────────────┐      │
│  │  DisclosureCtrl   │  │       IPFS/Pinata       │      │
│  │                   │  │                        │      │
│  │ • Permission LVL  │  │  • Encrypted Storage    │      │
│  │ • Access Control  │  │  • CID References      │      │
│  └───────────────────┘  └───────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## 📍 Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| **AccessControl** | `0xcce613271DCBac6aF3CF4eBf53E4C992d6D8ef69` |
| **LeakProofCore** | `0x857dfb28574F58a67e7334a33EA7a00263Df9797` |
| **ReviewerHub** | `0x9D0c1dbbAF2E4849c27B88f8E8DA165D764ffB1b` |
| **DisclosureController** | `0xB2078Aae5782788CA551A8212E27901233260E23` |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or any Web3 wallet
- Sepolia ETH ([faucet](https://faucets.chain.link/))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/leakproof.git
cd leakproof

# Install dependencies
npm install

# Deploy contracts (optional - already deployed)
cd contracts
node scripts/deploy.js

# Start frontend
cd ../frontend
npm run dev
```

### Configuration

Create `.env.local` in frontend:

```env
NEXT_PUBLIC_ACCESS_CONTROL=0xcce613271DCBac6aF3CF4eBf53E4C992d6D8ef69
NEXT_PUBLIC_CORE=0x857dfb28574F58a67e7334a33EA7a00263Df9797
NEXT_PUBLIC_REVIEWER_HUB=0x9D0c1dbbAF2E4849c27B88f8E8DA165D764ffB1b
NEXT_PUBLIC_DISCLOSURE_CTRL=0xB2078Aae5782788CA551A8212E27901233260E23
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
```

Then open [http://localhost:3000](http://localhost:3000)

---

## 🗺️ Roadmap

### Wave 1 ✅ (Completed - **Current**)
**Foundation & Core**
- [x] Smart contract development & deployment to Sepolia
- [x] Encrypted case creation & storage
- [x] Role-based access control (Admin/Reviewer/Reporter)
- [x] Reviewer assignment & encrypted voting
- [x] Basic frontend with wallet connect (wagmi + RainbowKit)
- [x] IPFS integration for evidence storage
- [x] UI with particle effects, animations & glassmorphism
- [x] Interactive canvas with mouse-following particles
- [x] Drag & drop evidence upload
- [x] Sepolia testnet deployment

### Wave 2 🔄 (In Progress)
**Enhanced Privacy & UX**
- [ ] CoFHE SDK integration for true FHE encryption
- [ ] ZK-proof generation for encrypted inputs
- [ ] Real-time case status updates via events
- [ ] Enhanced reviewer dashboard
- [ ] Multi-language support (i18n)
- [ ] Dark/Light theme toggle
- [ ] Notification system

### Wave 3 📋 (Planned)
**Advanced Features**
- [ ] Anonymous reputation system
- [ ] Time-locked disclosure with emergency override
- [ ] Multi-reviewer consensus (2-of-3, 3-of-5)
- [ ] DAO governance for reviewer selection
- [ ] Encrypted case categories
- [ ] Token-gated submission (anti-spam)
- [ ] Bounty/reward layer

### Wave 4 🔐 (Planned)
**Enterprise & Compliance**
- [ ] SOC2/HIPAA compliance audit
- [ ] Legal export package generation
- [ ] Integration with legal/HR systems
- [ ] White-label enterprise dashboard
- [ ] Custom workflow builder
- [ ] API access
- [ ] SAML/SSO enterprise auth

### Wave 5 🚀 (Future)
**Scale & Ecosystem**
- [ ] Layer 2 migration (Arbitrum/Optimism)
- [ ] Cross-chain disclosure verification
- [ ] NFT-based reputation凭证
- [ ] Decentralized IPFS pinning
- [ ] Privacy-preserving analytics
- [ ] Mobile app (iOS/Android)
- [ ] Partnership integrations

---

## 📱 How It Works

### Reporter Flow
```
1. Connect wallet → Dashboard
2. Click "Submit New Report"
3. Fill encrypted form:
   • Title (client-side encrypted)
   • Description (client-side encrypted)
   • Category (encrypted)
   • Severity (1-5)
   • Evidence files → IPFS
4. Submit → Transaction on Ethereum Sepolia
5. Receive Case ID (track privately)
```

### Reviewer Flow
```
1. Admin assigns to case
2. Connect wallet → Reviewer Dashboard
3. View assigned cases
4. Click case → Review page
5. Submit encrypted vote:
   • Recommendation (approve/reject/escalate)
   • Severity score (1-5)
   • Confidential notes
6. Consensus triggers verification
```

### Admin Flow
```
1. Connect wallet → Admin Dashboard
2. View all cases by status
3. Assign reviewers to cases
4. Monitor workflow stages
5. Grant disclosure permissions
6. Emergency controls if needed
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, custom animations |
| **Wallet** | wagmi v2, RainbowKit, viem |
| **Privacy** | CoFHE SDK (Fhenix), client-side AES encryption |
| **Storage** | IPFS, Pinata SDK |
| **Contracts** | Solidity, Hardhat, OpenZeppelin |
| **Chain** | Ethereum Sepolia Testnet |

---

## 🔒 Security Model

```
1. ENCRYPT BEFORE CHAIN
   └── All sensitive data encrypted client-side

2. MINIMAL ON-CHAIN DATA
   └── Only encrypted blobs + references stored

3. ROLE VERIFICATION
   └── Every action checked against AccessControl

4. TIME-LOCKED DISCLOSURE
   └── Identity reveal requires admin approval

5. AUDIT WITHOUT EXPOSURE
   └── Process verifiable, content protected
```

---

## 📊 Contract Stats

| Metric | Value |
|--------|-------|
| Contracts Deployed | 4 |
| Gas Used (Deploy) | ~3.9M |
| Network | Ethereum Sepolia |
| Encryption | AES-256 (client-side) |
| Evidence Storage | IPFS + On-chain CID |

---

## 🎨 UI Features

- **Interactive canvas** — Mouse-following particles with grid connections
- **Glassmorphism** — Frosted glass cards and panels
- **Animated counters** — Stats animate on scroll
- **Drag & drop** — Evidence file upload with animations
- **Gradient animations** — Text and borders animate
- **Hover effects** — Cards lift and glow
- **Progress steps** — Visual form submission flow
- **Dark theme** — Professional dark UI

---

## 📁 Project Structure

```
leakproof/
├── contracts/                    # Smart contracts
│   ├── contracts/
│   │   ├── AccessControl.sol     # Role management
│   │   ├── LeakProofCore.sol    # Case management
│   │   ├── ReviewerHub.sol      # Voting system
│   │   └── DisclosureCtrl.sol  # Permissions
│   ├── scripts/
│   │   └── deploy.js           # Deployment script
│   └── artifacts/              # Compiled contracts
│
├── frontend/                    # Next.js application
│   ├── app/                    # App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── reporter/
│   │   │   ├── dashboard/     # Reporter dashboard
│   │   │   └── submit/         # Submit report
│   │   ├── reviewer/
│   │   │   ├── dashboard/     # Reviewer dashboard
│   │   │   └── case/[id]/      # Case review page
│   │   └── admin/
│   │       └── dashboard/       # Admin panel
│   ├── components/             # React components
│   │   ├── InteractiveCanvas.tsx  # Particle effects
│   │   ├── AnimatedCounter.tsx    # Number animations
│   │   └── DragDropZone.tsx       # File uploads
│   ├── hooks/                  # wagmi hooks
│   ├── lib/                    # Utilities
│   │   ├── contracts.ts        # ABIs + addresses
│   │   ├── cofhe.ts           # Encryption utils
│   │   └── pinata.ts          # IPFS integration
│   └── lib/
│       └── wagmi.ts            # Wallet config
│
├── .env.local                  # Environment variables
├── package.json                # Workspace config
└── README.md                  # This file
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Fhenix](https://fhenix.io) — Confidential smart contracts
- [CoFHE](https://cofhe-docs.fhenix.zone) — FHE SDK
- [OpenZeppelin](https://openzeppelin.com) — Smart contract libraries
- [RainbowKit](https://rainbow.me) — Beautiful wallet connect
- [Next.js](https://nextjs.org) — React framework
- [Wavehack](https://wavehack.io) — Hackathon support

---

## 📞 Contact

- 🌐 Website: [leakproof.vercel.app](https://leakproof.vercel.app)
- 🐦 Twitter: [@LeakProofX](https://twitter.com/LeakProofX)
- 💬 Discord: [Join](https://discord.gg/leakproof)
- 📧 Email: hello@leakproof.xyz

---

<p align="center">
  <strong>Built with ❤️ for privacy-first whistleblowing</strong>
  <br>
  <sub>LeakProof X — Your voice, protected.</sub>
</p>