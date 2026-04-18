export { createCofheConfig, createCofheClient } from '@cofhe/sdk/web';
export { sepolia } from '@cofhe/sdk/chains';
export { Encryptable, FheTypes } from '@cofhe/sdk';

export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex.replace('0x', ''), 'hex'));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

export function formatAddress(addr: string, start = 6, end = 4): string {
  if (!addr || addr.length < start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}