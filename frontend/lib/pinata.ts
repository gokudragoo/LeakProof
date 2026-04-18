const PINATA_BASE_URL = 'https://api.pinata.cloud';

export async function uploadToIPFS(
  file: File | Blob,
  jwt: string
): Promise<string> {
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

export async function encryptAndUpload(
  file: File,
  key: Uint8Array,
  jwt: string
): Promise<string> {
  const encrypted = await encryptFile(file, key);
  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const filename = file.name + '.encrypted';
  const encryptedFile = new File([blob], filename, { type: 'application/octet-stream' });

  return await uploadToIPFS(encryptedFile, jwt);
}

async function encryptFile(file: File, key: Uint8Array): Promise<ArrayBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }

  const result = new Uint8Array(iv.length + encrypted.length);
  result.set(iv);
  result.set(encrypted, iv.length);

  return result.buffer;
}

export async function decryptFile(
  encryptedData: ArrayBuffer,
  key: Uint8Array
): Promise<Blob> {
  const data = new Uint8Array(encryptedData);

  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);

  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ key[i % key.length];
  }

  return new Blob([decrypted]);
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
    } catch (e) {
      continue;
    }
  }

  throw new Error('Failed to fetch from IPFS');
}