'use client';

import { createCofheConfig, createCofheClient } from '@cofhe/sdk/web';
import { sepolia } from '@cofhe/sdk/chains';

export const cofheConfig = createCofheConfig({
  environment: 'web',
  supportedChains: [sepolia],
  useWorkers: true,
  mocks: {
    decryptDelay: 0,
    encryptDelay: [100, 100, 100, 500, 500],
  },
});

export function createCofheClientInstance() {
  return createCofheClient(cofheConfig);
}

let cofheClientInstance: ReturnType<typeof createCofheClient> | null = null;

export function getCofheClient() {
  if (!cofheClientInstance) {
    cofheClientInstance = createCofheClientInstance();
  }
  return cofheClientInstance;
}
