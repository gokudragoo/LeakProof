# LeakProof X

Whistleblowing workflow on Ethereum Sepolia with:
- on-chain case lifecycle
- reviewer assignment and voting
- IPFS-backed report payloads
- disclosure permissions

## Current Status

This repo is now working as a real Sepolia demo flow:
- report submission waits for a confirmed receipt and reads the real `caseId` from `CaseCreated`
- reviewer voting waits for confirmation before showing success
- evidence CIDs are stored correctly as strings, not cast to `bytes32`
- reviewer consensus only counts real approve/reject/escalate votes
- duplicate reviewer assignment is blocked
- dashboards render live contract state instead of placeholder cards
- root scripts use `npm` workspaces instead of `yarn`
- contract tests and frontend production build pass

Important:
- this build is on-chain and working
- it is not a true Fhenix/CoFHE confidential-computation implementation yet
- the current privacy model is IPFS payload storage plus SHA-256 digests anchored on-chain

## Verified Checks

The latest local verification pass succeeded with:
- `npm run compile --workspace contracts`
- `npm run test --workspace contracts`
- `npm run build --workspace frontend`

Contract tests: `6 passing`

## Live Sepolia Contracts

Deployed from this repo:

| Contract | Address |
|---|---|
| `LeakProofAccessControl` | `0x74eEB24e602F8b6F64DC704C88655fADe3985EF1` |
| `LeakProofCore` | `0xf877025f5d0031a21188b9FbE8506226D9715a6F` |
| `ReviewerHub` | `0x78Ca71B21bf740B5c32D742B19E6Efd4B3f4729D` |
| `DisclosureController` | `0x83A080Bc3f1dADce4c4b334509AD6f2686d74ccF` |

Deployment record: [contracts/.env.deployed](C:/Users/parth/Desktop/LeakProof/contracts/.env.deployed)

## Architecture

### Reporter flow
1. Reporter connects wallet.
2. Report payload is uploaded to IPFS.
3. Browser computes a SHA-256 digest of the payload.
4. Contract stores `reportCid`, `reportDigest`, category, optional evidence CID/digest.
5. UI waits for the confirmed receipt and extracts the real `caseId`.

### Reviewer flow
1. Admin grants reviewer role and assigns a reviewer to a case.
2. Reviewer opens assigned case data from IPFS.
3. Reviewer submits `Approve`, `Reject`, or `Escalate` plus severity and notes.
4. `ReviewerHub` recomputes vote tallies and updates case status honestly.

### Admin flow
1. Grant reviewer roles.
2. Assign reviewers.
3. Set approval thresholds.
4. Grant disclosure permission levels.

## What Was Fixed

### Solved from the audit
- False success UI: fixed. Submission and voting now wait for confirmed receipts.
- Fake case IDs: fixed. Case IDs now come from the emitted event.
- Broken evidence CID handling: fixed. IPFS CIDs are stored as `string`.
- Bad consensus logic: fixed. Reject/escalate votes no longer count as approvals.
- Duplicate reviewer assignment: fixed.
- Over-authorized status flow: tightened. Status changes are constrained to intended actors and workflow.
- Placeholder dashboards: fixed. Pages now load real case data.
- Missing tests: fixed. Contract coverage was added for the critical workflows.
- Broken root scripts: fixed. Root scripts use `npm` workspaces.
- Frontend production build issues: fixed.

### Not solved yet
- True Fhenix/CoFHE privacy is not implemented.
- There are no encrypted FHE contract types, permits, or confidential computation flows yet.
- If you want WaveHack/Fhenix-accurate privacy claims, the next step is a real CoFHE rewrite.

## Environment Setup

### Root `.env`

Used by Hardhat deploys:

```env
SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=
```

### Frontend `frontend/.env.local`

Used by the Next.js app:

```env
NEXT_PUBLIC_ACCESS_CONTROL=0x74eEB24e602F8b6F64DC704C88655fADe3985EF1
NEXT_PUBLIC_CORE=0xf877025f5d0031a21188b9FbE8506226D9715a6F
NEXT_PUBLIC_REVIEWER_HUB=0x78Ca71B21bf740B5c32D742B19E6Efd4B3f4729D
NEXT_PUBLIC_DISCLOSURE_CTRL=0x83A080Bc3f1dADce4c4b334509AD6f2686d74ccF
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
PINATA_JWT=your_pinata_jwt
```

Notes:
- `PINATA_JWT` is server-side now through `/api/pinata`
- do not use `NEXT_PUBLIC_PINATA_JWT`

## Run Locally

```bash
npm install
npm run compile --workspace contracts
npm run test --workspace contracts
npm run build --workspace frontend
npm run dev --workspace frontend
```

Then open `http://localhost:3000`.

## Repo Layout

```text
contracts/
  contracts/
  scripts/
  test/
frontend/
  app/
  components/
  hooks/
  lib/
```

## Next Recommended Step

If you want this project to fully match the original Fhenix/WaveHack privacy goal, replace the current digest-and-CID model with:
- real CoFHE encrypted types
- encrypted review payload handling
- permit/decryption authorization flow
- updated UI copy that reflects the confidential-compute model
