'use client';

export type OfflineEvidenceDraft = {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataBase64: string;
};

export type OfflineReportDraft = {
  title: string;
  description: string;
  severity: number;
  category: number;
  updatedAt: string;
  evidence?: OfflineEvidenceDraft | null;
};

type DraftEnvelope = {
  version: 3;
  iv: string;
  ciphertext: ArrayBuffer;
};

type LegacyDraftEnvelope = {
  version: 2;
  iv: string;
  ciphertext: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const LEGACY_STORAGE_PREFIX = 'leakproof:encrypted-draft:';
const DRAFT_DB = 'leakproof-offline-drafts';
const DRAFT_KEY_STORE = 'keys';
const DRAFT_DATA_STORE = 'drafts';

function toBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function storageKey(walletAddress: string) {
  return `${LEGACY_STORAGE_PREFIX}${walletAddress.toLowerCase()}`;
}

function draftKeyId(walletAddress: string) {
  return `draft:${walletAddress.toLowerCase()}`;
}

function assertDraftCryptoAvailable() {
  if (!globalThis.crypto?.subtle || typeof indexedDB === 'undefined') {
    throw new Error('Secure draft storage is unavailable in this browser.');
  }
}

function openDraftDb() {
  assertDraftCryptoAvailable();

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DRAFT_DB, 2);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFT_KEY_STORE)) {
        db.createObjectStore(DRAFT_KEY_STORE);
      }
      if (!db.objectStoreNames.contains(DRAFT_DATA_STORE)) {
        db.createObjectStore(DRAFT_DATA_STORE);
      }
    };

    request.onerror = () => reject(request.error ?? new Error('Unable to open secure draft store.'));
    request.onsuccess = () => resolve(request.result);
  });
}

function requestAsPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onerror = () => reject(request.error ?? new Error('Draft store request failed.'));
    request.onsuccess = () => resolve(request.result);
  });
}

function transactionAsPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.onabort = () => reject(transaction.error ?? new Error('Draft store transaction aborted.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('Draft store transaction failed.'));
    transaction.oncomplete = () => resolve();
  });
}

async function readStoreValue<T>(storeName: string, key: string) {
  const db = await openDraftDb();

  try {
    const transaction = db.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).get(key) as IDBRequest<T | undefined>;
    return (await requestAsPromise(request)) ?? null;
  } finally {
    db.close();
  }
}

async function writeStoreValue<T>(storeName: string, key: string, value: T) {
  const db = await openDraftDb();

  try {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(value, key);
    await transactionAsPromise(transaction);
  } finally {
    db.close();
  }
}

async function deleteStoreValue(storeName: string, key: string) {
  const db = await openDraftDb();

  try {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(key);
    await transactionAsPromise(transaction);
  } finally {
    db.close();
  }
}

async function getDraftKey(walletAddress: string) {
  const keyId = draftKeyId(walletAddress);
  const existing = await readStoreValue<CryptoKey>(DRAFT_KEY_STORE, keyId);
  if (existing) {
    return existing;
  }

  const generated = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  await writeStoreValue(DRAFT_KEY_STORE, keyId, generated);
  return generated;
}

export async function fileToDraftEvidence(file: File): Promise<OfflineEvidenceDraft> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    dataBase64: toBase64(bytes),
  };
}

export function draftEvidenceToFile(evidence: OfflineEvidenceDraft) {
  const bytes = fromBase64(evidence.dataBase64);
  return new File([toArrayBuffer(bytes)], evidence.name, {
    type: evidence.type,
    lastModified: evidence.lastModified,
  });
}

export async function saveEncryptedDraft(walletAddress: string, draft: OfflineReportDraft) {
  if (typeof window === 'undefined') {
    return;
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getDraftKey(walletAddress);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    encoder.encode(JSON.stringify(draft))
  );

  const envelope: DraftEnvelope = {
    version: 3,
    iv: toBase64(iv),
    ciphertext: encrypted,
  };

  await writeStoreValue(DRAFT_DATA_STORE, draftKeyId(walletAddress), envelope);
  window.localStorage.removeItem(storageKey(walletAddress));
}

async function decryptDraftEnvelope(walletAddress: string, envelope: DraftEnvelope) {
  const key = await getDraftKey(walletAddress);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(fromBase64(envelope.iv)) },
    key,
    envelope.ciphertext
  );

  return JSON.parse(decoder.decode(decrypted)) as OfflineReportDraft;
}

async function loadLegacyDraft(walletAddress: string) {
  const raw = window.localStorage.getItem(storageKey(walletAddress));
  if (!raw) {
    return null;
  }

  const envelope = JSON.parse(raw) as LegacyDraftEnvelope;
  if (envelope.version !== 2) {
    return null;
  }

  const key = await getDraftKey(walletAddress);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(fromBase64(envelope.iv)) },
    key,
    toArrayBuffer(fromBase64(envelope.ciphertext))
  );

  const draft = JSON.parse(decoder.decode(decrypted)) as OfflineReportDraft;
  await saveEncryptedDraft(walletAddress, draft);
  return draft;
}

export async function loadEncryptedDraft(walletAddress: string): Promise<OfflineReportDraft | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const envelope = await readStoreValue<DraftEnvelope>(DRAFT_DATA_STORE, draftKeyId(walletAddress));
  if (envelope?.version === 3) {
    return decryptDraftEnvelope(walletAddress, envelope);
  }

  return loadLegacyDraft(walletAddress);
}

export function clearEncryptedDraft(walletAddress: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(storageKey(walletAddress));
  void deleteStoreValue(DRAFT_DATA_STORE, draftKeyId(walletAddress));
}
