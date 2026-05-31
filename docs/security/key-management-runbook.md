# Key Management Runbook

## Production Custody

1. Deploy with a funded temporary deployer key.
2. Open `/admin/onboarding` with the deployer wallet.
3. Use `/admin/onboarding` to rotate default admin custody to the organization multisig.
4. Confirm the deployer wallet no longer has admin access.
5. Confirm the multisig can access `/admin/dashboard`.
6. Store the deployer key as inactive and never reuse it for admin operations.

## Emergency Reviewer Recovery

1. Identify the compromised reviewer wallet.
2. Create or approve a replacement reviewer wallet.
3. Open `/admin/onboarding`.
4. Submit the compromised and replacement addresses in Reviewer Recovery.
5. Confirm `ReviewerRoleRecovered` and `RoleRevoked` on the explorer.
6. Reassign open cases if operational policy requires a new reviewer set.

## Emergency Admin Response

- If a deployer or admin key is suspected compromised, rotate admin authority to the multisig immediately.
- Use emergency default-admin revocation from `/admin/onboarding` only for stale admin accounts that are not the connected signer.
- Activate TimeLockedDisclosure emergency pause if disclosure risk exists.
- Generate a compliance export and attach transaction hashes to the incident record.
