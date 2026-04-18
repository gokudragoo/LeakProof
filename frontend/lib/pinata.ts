import { deriveKeyFromWallet } from './cofhe';

const PINATA_BASE_URL = 'https://api.pinata.cloud';
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

export async function uploadToIPFS(file: File | Blob, jwt: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.IpfsHash;
}

export async function encryptFile(file: File, key: CryptoKey): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);

  return result;
}

export async function decryptFileData(encrypted: Uint8Array, key: CryptoKey): Promise<Blob> {
  const iv = encrypted.slice(0, IV_LENGTH);
  const ciphertext = encrypted.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new Blob([new Uint8Array(decrypted)]);
}

export async function encryptAndUpload(
  file: File,
  walletAddress: string,
  caseId: string,
  jwt: string
): Promise<string> {
  const key = await deriveKeyFromWallet(walletAddress, caseId);
  const encrypted = await encryptFile(file, key);
  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const filename = file.name + '.encrypted';
  const encryptedFile = new File([blob], filename, { type: 'application/octet-stream' });

  return await uploadToIPFS(encryptedFile, jwt);
}

export async function decryptFromIPFS(
  cid: string,
  walletAddress: string,
  caseId: string
): Promise<Blob> {
  const response = await fetchFromIPFS(cid);
  const arrayBuffer = await response.arrayBuffer();
  const encrypted = new Uint8Array(arrayBuffer);
  const key = await deriveKeyFromWallet(walletAddress, caseId);

  return await decryptFileData(encrypted, key);
}

export async function fetchFromIPFS(cid: string): Promise<Response> {
  const gateways = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
  ];

  for (const gateway of gateways) {
    try {
      const response = await fetch(`${gateway}${cid}`);
      if (response.ok) {
        return response;
      }
    } catch {
      continue;
    }
  }

  throw new Error('Failed to fetch from IPFS');
}
