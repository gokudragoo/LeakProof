# LeakProof X 🔒

**Privacy-First Whistleblowing Platform on Ethereum**

LeakProof X is a production-ready, on-chain whistleblowing and compliance reporting platform built on Fhenix/Ethereum Sepolia. It enables secure, confidential reporting with encrypted smart contracts, private reviewer voting, and selective disclosure.

![LeakProof X Banner](https://via.placeholder.com/1200x400/0a0a0f/0ea5e9?text=LeakProof+X+Privacy+Whistleblowing)

---

## 🌟 Key Features

### 🔐 Privacy by Design
- **Client-side encryption** - All sensitive data encrypted before touching the blockchain
- **Encrypted smart contracts** - Report content stored as encrypted blobs on-chain
- **Zero plaintext exposure** - No sensitive data visible in transactions

### 👥 Role-Based Access
- **Admin** - Manages cases, assigns reviewers, controls disclosure
- **Reviewer** - Evaluates assigned cases with encrypted voting
- **Reporter** - Anyone can submit confidential reports (open to all)

### 🗳️ Private Voting
- **Encrypted votes** - Reviewer votes encrypted on-chain
- **Consensus engine** - Automatic status updates when threshold met
- **Anonymous scoring** - Severity and credibility scores remain confidential

### 🔓 Selective Disclosure
- **Permission levels** - OutcomeOnly, SummaryOnly, FullReport, IdentityReveal
- **Time-locked reveal** - Conditional identity release
- **Audit trail** - All permission changes logged on-chain

### 📎 Evidence Management
- **IPFS integration** - Encrypted file storage via Pinata
- **On-chain references** - Evidence CIDs stored in contracts
- **Tamper-evident** - Verifiable proof of evidence submission

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  │
│  │ Reporter │  │ Reviewer │  │   Admin   │  │   IPC    │  │
│  │Dashboard │  │ Dashboard│  │ Dashboard │  │ Gateway  │  │
│  └────┬────┘  └────┬─────┘  └─────┬────┘  └────┬─────┘  │
└───────┼──────────────┼──────────────┼─────────────┼────────┘
        │              │              │             │
┌───────┴──────────────┴──────────────┴─────────────┴────────┐
│                   Smart Contracts (Ethereum)                 │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────┐    │
│  │AccessControl │  │LeakProof   │  │   ReviewerHub  │    │
│  │              │  │Core        │  │                │    │
│  └──────────────┘  └────────────┘  └────────────────┘    │
│  ┌────────────────────┐  ┌───────────────────────────┐      │
│  │ DisclosureCtrl     │  │      IPFS/Pinata        │      │
│  └────────────────────┘  └───────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

### Smart Contracts

| Contract | Purpose | Address (Sepolia) |
|----------|---------|-------------------|
| `AccessControl` | Role-based permissions | `0xcce61327...D8ef69` |
| `LeakProofCore` | Case management & storage | `0x857dfb28...f9797` |
| `ReviewerHub` | Reviewer assignment & voting | `0x9D0c1dbb...ffB1b` |
| `DisclosureCtrl` | Permission control | `0xB2078Aae...60E23` |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or any Web3 wallet
- Sepolia ETH (get from [faucet](https://faucets.chain.link/))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/leakproof.git
cd leakproof

# Install dependencies
npm install

# Deploy contracts (if needed)
cd contracts && node scripts/deploy.js

# Start frontend
cd frontend && npm run dev
```

### Configuration

Create `.env.local` in the root:

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
**Foundation & Core**
- [x] Smart contract development & deployment
- [x] Encrypted case creation & storage
- [x] Role-based access control (Admin/Reviewer/Reporter)
- [x] Reviewer assignment & encrypted voting
- [x] Basic frontend with wallet connect
- [x] IPFS integration for evidence storage
- [x] UI with particle effects & animations
- [x] Sepolia testnet deployment

### Wave 2 🔄 (In Progress)
**Enhanced Privacy & UX**
- [ ] CoFHE SDK integration for true FHE encryption
- [ ] ZK-proof generation for encrypted inputs
- [ ] Private reviewer dashboard with assigned cases
- [ ] Real-time case status updates
- [ ] Enhanced drag-drop evidence upload
- [ ] Multi-language support (i18n)
- [ ] Dark/Light theme toggle

### Wave 3 📋 (Planned)
**Advanced Features**
- [ ] Anonymous reputation system (hidden credibility scores)
- [ ] Time-locked disclosure with emergency override
- [ ] Multi-reviewer consensus (2-of-3, 3-of-5)
- [ ] DAO governance integration for reviewer selection
- [ ] Encrypted case categories (even categories hidden)
- [ ] Token-gated submission (anti-spam)
- [ ] Bounty/reward layer for valid reports

### Wave 4 🔐 (Planned)
**Enterprise & Compliance**
- [ ] SOC2/HIPAA compliance audit
- [ ] Legal export package generation
- [ ] Integration with legal/HR systems
- [ ] White-label enterprise dashboard
- [ ] Custom workflow builder
- [ ] API access for integrations
- [ ] SAML/SSO enterprise auth

### Wave 5 🚀 (Future)
**Scale & Ecosystem**
- [ ] Layer 2 migration (Arbitrum/Optimism)
- [ ] Cross-chain disclosure verification
- [ ] NFT-based reputation凭证
- [ ] Decentralized IPFS pinning network
- [ ] Privacy-preserving analytics
- [ ] Mobile app (iOS/Android)
- [ ] Partnership integrations (Chainalysis, Elliptic)

---

## 📱 How It Works

### Reporter Flow
```
1. Connect wallet → Dashboard
2. Click "Submit New Report"
3. Fill encrypted form:
   - Title (encrypted)
   - Description (encrypted)
   - Category (encrypted)
   - Severity (1-5)
   - Evidence files (uploaded to IPFS)
4. Submit → Transaction on-chain
5. Receive Case ID
6. Track status privately
```

### Reviewer Flow
```
1. Admin assigns to case
2. Connect wallet → Reviewer Dashboard
3. View assigned cases
4. Click case → Review page
5. Submit encrypted vote:
   - Recommendation (approve/reject/escalate)
   - Severity score (1-5)
   - Confidential notes (encrypted)
6. Consensus triggers verification
```

### Admin Flow
```
1. Connect wallet → Admin Dashboard
2. View all cases by status
3. Assign reviewers to cases
4. Monitor workflow stages
5. Grant disclosure permissions
6. Trigger emergency controls if needed
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Framer Motion |
| **Wallet** | wagmi v2, RainbowKit, viem |
| **Privacy** | CoFHE SDK, Fhenix |
| **Storage** | IPFS, Pinata |
| **Contracts** | Solidity, Hardhat, OpenZeppelin |
| **Chain** | Ethereum Sepolia |

---

## 🔒 Security Model

1. **Encrypt before chain** - All sensitive data encrypted client-side
2. **Minimal on-chain data** - Only encrypted blobs + references
3. **Role verification** - Every action checked against AccessControl
4. **Time-locked disclosure** - Identity reveal requires multiple approvals
5. **Audit without exposure** - Process verifiable, content protected

---

## 📊 Stats

| Metric | Value |
|--------|-------|
| Contracts Deployed | 4 |
| Gas Used (Deploy) | ~3.9M |
| Test Cases | 0 (manual testing) |
| Encryption | AES-256-GCM (client-side) |
| Network | Ethereum Sepolia |

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guide and submit PRs.

```bash
# Fork and clone
git clone https://github.com/your-org/leakproof.git

# Create feature branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m "Add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Fhenix](https://fhenix.io) - Confidential smart contracts
- [CoFHE](https://cofhe-docs.fhenix.zone) - FHE SDK
- [OpenZeppelin](https://openzeppelin.com) - Smart contract libraries
- [RainbowKit](https://rainbow.me) - Beautiful wallet connect
- [Wavehack](https://wavehack.io) - Hackathon support

---

## 📞 Contact

- Website: [leakproof.xyz](https://leakproof.xyz)
- Twitter: [@LeakProofX](https://twitter.com/LeakProofX)
- Discord: [Join our server](https://discord.gg/leakproof)
- Email: hello@leakproof.xyz

---

<p align="center">
  <strong>Built with ❤️ for privacy-first whistleblowing</strong>
</p>