'use client';

export type TransactionObservation = {
  id: string;
  action: string;
  status: 'submitted' | 'confirmed' | 'failed';
  hash?: `0x${string}`;
  message?: string;
  createdAt: string;
};

const STORAGE_KEY = 'leakproof:tx-observations';
const MAX_OBSERVATIONS = 30;

function readObservations(): TransactionObservation[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TransactionObservation[]) : [];
  } catch {
    return [];
  }
}

export function getTransactionObservations() {
  return readObservations();
}

export function recordTransactionObservation(
  action: string,
  status: TransactionObservation['status'],
  options: { hash?: `0x${string}`; message?: string } = {}
) {
  if (typeof window === 'undefined') {
    return;
  }

  const next: TransactionObservation = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action,
    status,
    hash: options.hash,
    message: options.message,
    createdAt: new Date().toISOString(),
  };

  const observations = [next, ...readObservations()].slice(0, MAX_OBSERVATIONS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
}

