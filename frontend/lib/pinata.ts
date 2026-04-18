const PINATA_BASE_URL = 'https://api.pinata.cloud';

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
