export interface UploadAuthorization {
  address: `0x${string}`;
  timestamp: number;
  nonce: string;
  signature: `0x${string}`;
}

export function buildUploadAuthMessage(address: string, timestamp: number, nonce: string) {
  return [
    "LeakProof upload authorization",
    `Address: ${address}`,
    `Timestamp: ${timestamp}`,
    `Nonce: ${nonce}`,
    "This signature only authorizes encrypted IPFS uploads for LeakProof.",
  ].join("\n");
}

export function uploadAuthHeaders(auth?: UploadAuthorization): Record<string, string> {
  if (!auth) {
    return {};
  }

  return {
    "x-leakproof-address": auth.address,
    "x-leakproof-timestamp": String(auth.timestamp),
    "x-leakproof-nonce": auth.nonce,
    "x-leakproof-signature": auth.signature,
  };
}
