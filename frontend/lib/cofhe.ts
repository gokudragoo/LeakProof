export function stringToBytes(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

export function bytesToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

export function hashString(text: string): bigint {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return BigInt(Math.abs(hash));
}

export function encryptField(plaintext: string, key: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }
  return encrypted;
}

export function decryptField(encrypted: Uint8Array, key: Uint8Array): string {
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ key[i % key.length];
  }
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export function deriveKeyFromWallet(address: string, caseId: string): Uint8Array {
  const combined = address.toLowerCase() + caseId;
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);

  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = data[i % data.length];
  }
  return key;
}