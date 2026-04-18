export const EMPTY_DIGEST: `0x${string}` =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return `0x${bytesToHex(new Uint8Array(digest))}` as `0x${string}`;
}

export async function sha256File(file: File | Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return `0x${bytesToHex(new Uint8Array(digest))}` as `0x${string}`;
}

export function shortAddress(address?: string | null) {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: number) {
  if (!timestamp) {
    return "Pending";
  }

  return new Date(timestamp * 1000).toLocaleString();
}
