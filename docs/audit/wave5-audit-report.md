# Wave 5 Audit Package

## Status

The repository now includes the materials needed for an external independent audit: threat model, key-management runbook, deployment manifest generation, CI checks, npm audit reporting, and Sepolia smoke-test automation.

## Contract Areas For Review

- `LeakProofAccessControl`: admin transfer, default admin revocation, reviewer recovery
- `LeakProofCore`: report CID/digest anchoring, encrypted severity ACL grants, status transitions
- `ReviewerHub`: encrypted vote normalization, encrypted tally verification, consensus publication
- `DisclosureController`: permission levels, request resolution, identity reveal eventing
- `TimeLockedDisclosure`: emergency pause, unlock approvals, override cooldown
- `ReputationRegistry`: case outcome updates and reviewer accuracy accounting
- `LeakProofDAO`: proposal lifecycle and executable actions

## Automated Evidence

- Contract compile
- Hardhat test entrypoint
- Frontend production build
- npm audit JSON and summary
- Deployment manifest
- Optional Sepolia bytecode check and CoFHE smoke test

## External Auditor Handoff

Provide the auditor:

- Repository commit hash or release tag
- `deployments/sepolia.manifest.json`
- `docs/security/threat-model.md`
- `docs/security/key-management-runbook.md`
- Latest CI artifact bundle
- Sepolia explorer links for every deployed contract

