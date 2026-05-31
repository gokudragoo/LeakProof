import type { ReportPayload } from "@/types";

const KEY_STORAGE_PREFIX = "leakproof.caseAccessKey.v1.";
const JSON_KIND = "leakproof.encrypted-json";
const FILE_KIND = "leakproof.encrypted-file";
const ALG = "AES-GCM";
const IV_BYTES = 12;
const KEY_BYTES = 32;

export interface EncryptedJsonEnvelope {
  version: 1;
  kind: typeof JSON_KIND;
  alg: typeof ALG;
  iv: string;
  ciphertext: string;
  meta: {
    contentType: "application/json";
    schema: string;
    encryptedAt: string;
  };
}

interface EncryptedFileHeader {
  version: 1;
  kind: typeof FILE_KIND;
  alg: typeof ALG;
  iv: string;
  originalName: string;
  mimeType: string;
  size: number;
  encryptedAt: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function ensureBrowserCrypto() {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Secure browser crypto is unavailable.");
  }
}

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeBase64Url(bytes: Uint8Array) {
  return encodeBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return decodeBase64(padded);
}

function randomIv() {
  const iv = new Uint8Array(IV_BYTES);
  crypto.getRandomValues(iv);
  return iv;
}

function sanitizeEncryptedFileName(fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 100) || "evidence";
  return `${safeName}.lpxenc`;
}

export function normalizeCaseAccessKey(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export async function generateCaseAccessKey() {
  ensureBrowserCrypto();
  const rawKey = new Uint8Array(KEY_BYTES);
  crypto.getRandomValues(rawKey);
  return encodeBase64Url(rawKey);
}

async function importCaseAccessKey(accessKey: string) {
  ensureBrowserCrypto();
  const rawKey = decodeBase64Url(normalizeCaseAccessKey(accessKey));
  if (rawKey.byteLength !== KEY_BYTES) {
    throw new Error("Case access key is invalid.");
  }

  return crypto.subtle.importKey("raw", rawKey, ALG, false, ["encrypt", "decrypt"]);
}

export function saveCaseAccessKey(caseId: number, accessKey: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(`${KEY_STORAGE_PREFIX}${caseId}`, normalizeCaseAccessKey(accessKey));
}

export function loadCaseAccessKey(caseId: number) {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(`${KEY_STORAGE_PREFIX}${caseId}`) ?? "";
}

export function isEncryptedJsonEnvelope(value: unknown): value is EncryptedJsonEnvelope {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { kind?: string }).kind === JSON_KIND &&
      (value as { alg?: string }).alg === ALG
  );
}

export async function encryptReportPayload(payload: ReportPayload, accessKey: string): Promise<EncryptedJsonEnvelope> {
  const key = await importCaseAccessKey(accessKey);
  const iv = randomIv();
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: ALG, iv }, key, plaintext));

  return {
    version: 1,
    kind: JSON_KIND,
    alg: ALG,
    iv: encodeBase64(iv),
    ciphertext: encodeBase64(ciphertext),
    meta: {
      contentType: "application/json",
      schema: "leakproof.report.v1",
      encryptedAt: new Date().toISOString(),
    },
  };
}

export async function decryptReportPayload(envelope: EncryptedJsonEnvelope, accessKey: string): Promise<ReportPayload> {
  const key = await importCaseAccessKey(accessKey);
  const plaintext = await crypto.subtle.decrypt(
    { name: ALG, iv: decodeBase64(envelope.iv) },
    key,
    decodeBase64(envelope.ciphertext)
  );
  return JSON.parse(decoder.decode(plaintext)) as ReportPayload;
}

export async function encryptTextWithAccessKey(value: string, accessKey: string) {
  if (!value.trim()) {
    return "";
  }

  const envelope = await encryptReportPayload(
    {
      title: "Reviewer note",
      description: value,
      category: 0,
      createdAt: new Date().toISOString(),
      reporterAddress: "",
    },
    accessKey
  );
  return JSON.stringify(envelope);
}

export async function encryptEvidenceFile(file: File, accessKey: string) {
  const key = await importCaseAccessKey(accessKey);
  const iv = randomIv();
  const plaintext = await file.arrayBuffer();
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: ALG, iv }, key, plaintext));
  const header: EncryptedFileHeader = {
    version: 1,
    kind: FILE_KIND,
    alg: ALG,
    iv: encodeBase64(iv),
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    encryptedAt: new Date().toISOString(),
  };
  const headerBytes = encoder.encode(JSON.stringify(header));
  const headerLength = new Uint8Array(4);
  new DataView(headerLength.buffer).setUint32(0, headerBytes.byteLength, false);

  return new File([headerLength, headerBytes, ciphertext], sanitizeEncryptedFileName(file.name), {
    type: "application/octet-stream",
  });
}

export async function decryptEvidenceBlob(blob: Blob, accessKey: string) {
  const key = await importCaseAccessKey(accessKey);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.byteLength < 4) {
    throw new Error("Encrypted evidence file is invalid.");
  }

  const headerLength = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, false);
  const headerStart = 4;
  const headerEnd = headerStart + headerLength;
  if (headerEnd >= bytes.byteLength) {
    throw new Error("Encrypted evidence header is invalid.");
  }

  const header = JSON.parse(decoder.decode(bytes.slice(headerStart, headerEnd))) as EncryptedFileHeader;
  if (header.kind !== FILE_KIND || header.alg !== ALG) {
    throw new Error("Evidence file is not a LeakProof encrypted file.");
  }

  const plaintext = await crypto.subtle.decrypt(
    { name: ALG, iv: decodeBase64(header.iv) },
    key,
    bytes.slice(headerEnd)
  );

  return new File([plaintext], header.originalName, {
    type: header.mimeType || "application/octet-stream",
  });
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
