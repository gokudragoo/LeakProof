import { NextResponse } from "next/server";

const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning";

function getPinataJwt() {
  return process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT;
}

async function parsePinataError(response: Response) {
  try {
    const data = await response.json();
    return JSON.stringify(data);
  } catch {
    return response.statusText || "Pinata request failed";
  }
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const jwt = getPinataJwt();

  if (!jwt) {
    return NextResponse.json(
      { message: "PINATA_JWT is not configured on the server" },
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "A file is required" }, { status: 400 });
    }

    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file, file.name);

    const response = await fetch(`${PINATA_ENDPOINT}/pinFileToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: upstreamFormData,
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: await parsePinataError(response) },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  }

  const payload = await request.json();
  const response = await fetch(`${PINATA_ENDPOINT}/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pinataContent: payload }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: await parsePinataError(response) },
      { status: response.status }
    );
  }

  return NextResponse.json(await response.json());
}
