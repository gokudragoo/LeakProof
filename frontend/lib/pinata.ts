const PUBLIC_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
];

async function parsePinataResponse(response: Response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Pinata request failed");
  }

  return response.json();
}

export async function uploadFileToIPFS(file: File | Blob, fileName?: string) {
  const formData = new FormData();
  formData.append("file", file, fileName);

  const response = await fetch("/api/pinata", {
    method: "POST",
    body: formData,
  });

  const data = await parsePinataResponse(response);
  return String(data.IpfsHash);
}

export async function uploadJsonToIPFS(payload: unknown) {
  const response = await fetch("/api/pinata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parsePinataResponse(response);
  return String(data.IpfsHash);
}

export function getIpfsUrl(cid: string) {
  return cid ? `${PUBLIC_GATEWAYS[0]}${cid}` : "";
}

export async function fetchJsonFromIPFS<T>(cid: string): Promise<T> {
  for (const gateway of PUBLIC_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}${cid}`, {
        cache: "no-store",
      });

      if (response.ok) {
        return (await response.json()) as T;
      }
    } catch {
      // Try the next public gateway.
    }
  }

  throw new Error("Unable to load IPFS content");
}
