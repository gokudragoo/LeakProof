# LeakProof X Wave 5 Threat Model

## Scope

This model covers the Sepolia deployment of LeakProof X contracts, the Next.js frontend, Pinata/IPFS upload path, CoFHE encrypted inputs, admin/reviewer/report workflows, and compliance exports.

## Assets

- Reporter plaintext report content before IPFS upload
- Evidence file bytes before IPFS upload
- IPFS CIDs and SHA-256 digests anchored on-chain
- CoFHE encrypted severity and vote handles
- Admin, reviewer, deployer, and multisig keys
- Disclosure permission state and identity reveal events
- DAO and reputation state

## Trust Boundaries

- Browser wallet signs transactions and CoFHE permits.
- CoFHE SDK encrypts inputs client-side and verifies decrypt results before `publishConsensus`.
- Smart contracts store CIDs, digests, encrypted handles, roles, and workflow state.
- Pinata stores report/evidence payloads by CID. Contracts never store plaintext report bodies.
- Admin multisig is the production authority for role recovery, disclosure controls, and emergency operations.

## Primary Threats And Controls

| Threat | Control |
| --- | --- |
| Deployer key compromise | `rotateDefaultAdmin`, multisig runbook, emergency default-admin revocation |
| Reviewer key compromise | `recoverReviewerRole` removes compromised reviewer and grants replacement |
| Plaintext leakage in auditor exports | Compliance exports include only on-chain metadata, CIDs, and digests |
| Failed or stuck wallet actions | Local transaction observation panel tracks submitted, confirmed, and failed actions |
| RPC outage or wrong deployment | `/api/health` and Operations page check chain ID, latest block, and bytecode |
| Event history slow to scan | Wave 5 indexer reads recent on-chain events for case, assignment, vote, and status history |
| Offline reporter abandonment | PWA shell and encrypted local drafts preserve report text on-device |
| Unauthorized disclosure | Disclosure levels remain contract-gated and identity reveal emits an on-chain event |

## Residual Risks

- Third-party audit signoff still requires an external reviewer to attest findings independently.
- IPFS payload access control depends on how upload credentials and gateways are operated.
- Browser-local encrypted drafts are device-local and wallet-derived; they protect against casual disk inspection, not a fully compromised device.
- Sepolia uptime depends on the configured RPC provider.

## Verification Checklist

- `npm run compile --workspace contracts`
- `npm run test:hardhat --workspace contracts`
- `npm run build --workspace frontend`
- `npm run audit:report`
- `npm run manifest --workspace contracts`
- `npm run check:deployment --workspace contracts`
- `npm run test --workspace contracts` with Sepolia RPC and testnet key
