# Organization Onboarding And Role Recovery

## Admin Setup

- Use `/admin/onboarding` to rotate organization admin custody to the multisig.
- Use `/admin/operations` to verify bytecode and RPC health.
- Generate `deployments/sepolia.manifest.json` for the release record.

## Reviewer Invite

- Admin enters reviewer wallet in `/admin/onboarding`.
- Reviewer connects wallet and opens `/reviewer/dashboard`.
- Admin assigns case from `/admin/dashboard`.

## Recovery

- Reviewer compromise: use `recoverReviewerRole(compromised, replacement)`.
- Deployer rotation: use `rotateDefaultAdmin(multisig, connectedAdmin)` from `/admin/onboarding`.
- Disclosure incident: use TimeLockedDisclosure emergency pause, then export auditor pack.
