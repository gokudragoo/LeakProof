import { NextResponse } from "next/server";
import { isAddress, verifyMessage } from "viem";
import { buildUploadAuthMessage } from "@/lib/upload-auth";

const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 512 * 1024;
const MAX_JSON_BYTES = 256 * 1024;
const PINATA_TIMEOUT_MS = 15_000;
const UPLOAD_AUTH_MAX_AGE_MS = 5 * 60_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const ALLOWED_FILE_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt", ".lpxenc"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/octet-stream",
]);

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const globalRateLimit = globalThis as typeof globalThis & {
  __leakproofPinataRateLimit?: Map<string, RateLimitBucket>;
};

function rateLimitStore() {
  if (!globalRateLimit.__leakproofPinataRateLimit) {
    globalRateLimit.__leakproofPinataRateLimit = new Map();
  }
  return globalRateLimit.__leakproofPinataRateLimit;
}

function getPinataJwt() {
  return process.env.PINATA_JWT;
}

function getPinataKeyAuth() {
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;

  if (!apiKey || !apiSecret) {
    return null;
  }

  return {
    pinata_api_key: apiKey,
    pinata_secret_api_key: apiSecret,
  };
}

function getPinataAuthHeaders() {
  const keyAuth = getPinataKeyAuth();
  if (keyAuth) {
    return keyAuth;
  }

  const jwt = getPinataJwt();
  if (!jwt) {
    return null;
  }

  return {
    Authorization: `Bearer ${jwt}`,
  };
}

function getClientKey(request: Request, walletAddress?: string) {
  if (walletAddress) {
    return walletAddress.toLowerCase();
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

function enforceRateLimit(request: Request, walletAddress?: string) {
  const store = rateLimitStore();
  const key = getClientKey(request, walletAddress);
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { message: "Upload rate limit exceeded. Try again shortly." },
      { status: 429 }
    );
  }

  return null;
}

async function verifyUploadAuthorization(request: Request) {
  const address = request.headers.get("x-leakproof-address");
  const timestampValue = request.headers.get("x-leakproof-timestamp");
  const nonce = request.headers.get("x-leakproof-nonce");
  const signature = request.headers.get("x-leakproof-signature");

  if (!address || !timestampValue || !nonce || !signature) {
    return {
      error: NextResponse.json({ message: "Signed upload authorization is required" }, { status: 401 }),
    };
  }

  if (!isAddress(address) || !/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    return {
      error: NextResponse.json({ message: "Upload authorization is invalid" }, { status: 401 }),
    };
  }

  const timestamp = Number(timestampValue);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > UPLOAD_AUTH_MAX_AGE_MS) {
    return {
      error: NextResponse.json({ message: "Upload authorization expired" }, { status: 401 }),
    };
  }

  const valid = await verifyMessage({
    address: address as `0x${string}`,
    message: buildUploadAuthMessage(address, timestamp, nonce),
    signature: signature as `0x${string}`,
  });

  if (!valid) {
    return {
      error: NextResponse.json({ message: "Upload authorization signature mismatch" }, { status: 401 }),
    };
  }

  return { address };
}

function contentLengthExceeds(request: Request, maxBytes: number) {
  const lengthHeader = request.headers.get("content-length");
  if (!lengthHeader) {
    return false;
  }

  const length = Number(lengthHeader);
  return Number.isFinite(length) && length > maxBytes;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120) || "evidence";
}

function validateEvidenceFile(file: File) {
  if (file.size <= 0) {
    return "Evidence file is empty.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Evidence files must be 10MB or smaller.";
  }

  const lowerName = file.name.toLowerCase();
  const extension = lowerName.includes(".") ? lowerName.slice(lowerName.lastIndexOf(".")) : "";
  if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
    return "Unsupported evidence file extension.";
  }
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return "Unsupported evidence file type.";
  }

  return null;
}

async function fetchPinata(path: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PINATA_TIMEOUT_MS);

  try {
    return await fetch(`${PINATA_ENDPOINT}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
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
  const pinataAuthHeaders = getPinataAuthHeaders();

  if (!pinataAuthHeaders) {
    return NextResponse.json(
      { message: "Pinata credentials are not configured on the server" },
      { status: 500 }
    );
  }

  const authorization = await verifyUploadAuthorization(request);
  if (authorization.error) {
    return authorization.error;
  }

  const rateLimited = enforceRateLimit(request, authorization.address);
  if (rateLimited) {
    return rateLimited;
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    if (contentLengthExceeds(request, MAX_MULTIPART_BYTES)) {
      return NextResponse.json({ message: "Upload body is too large" }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "A file is required" }, { status: 400 });
    }
    const validationError = validateEvidenceFile(file);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file, sanitizeFileName(file.name));

    let response: Response;
    try {
      response = await fetchPinata("/pinFileToIPFS", {
        method: "POST",
        headers: pinataAuthHeaders,
        body: upstreamFormData,
      });
    } catch {
      return NextResponse.json({ message: "Pinata file upload timed out" }, { status: 504 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: await parsePinataError(response) },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  }

  if (!contentType.includes("application/json")) {
    return NextResponse.json({ message: "Content-Type must be application/json or multipart/form-data" }, { status: 415 });
  }
  if (contentLengthExceeds(request, MAX_JSON_BYTES)) {
    return NextResponse.json({ message: "JSON payload is too large" }, { status: 413 });
  }

  const payload = await request.json();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ message: "JSON payload must be an object" }, { status: 400 });
  }

  const serializedPayload = JSON.stringify({ pinataContent: payload });
  if (new TextEncoder().encode(serializedPayload).byteLength > MAX_JSON_BYTES) {
    return NextResponse.json({ message: "JSON payload is too large" }, { status: 413 });
  }

  let response: Response;
  try {
    response = await fetchPinata("/pinJSONToIPFS", {
      method: "POST",
      headers: {
        ...pinataAuthHeaders,
        "Content-Type": "application/json",
      },
      body: serializedPayload,
    });
  } catch {
    return NextResponse.json({ message: "Pinata JSON upload timed out" }, { status: 504 });
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: await parsePinataError(response) },
      { status: response.status }
    );
  }

  return NextResponse.json(await response.json());
}
