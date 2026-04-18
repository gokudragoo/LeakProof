'use client';

import { useEffect, useState } from 'react';
import { Encryptable, FheTypes } from '@cofhe/sdk';
import { WagmiAdapter } from '@cofhe/sdk/adapters';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { numberToHex } from 'viem';
import type { EncryptedHandle, EncryptedUint8Input } from '@/types';

type CofheClientLike = {
  connect: (publicClient: unknown, walletClient: unknown) => Promise<void>;
  disconnect: () => void;
  encryptInputs: (inputs: unknown[]) => {
    execute: () => Promise<
      Array<{
        ctHash: bigint;
        securityZone: number;
        utype: number;
        signature: string;
      }>
    >;
  };
  decryptForView: (
    ctHash: `0x${string}`,
    utype: FheTypes
  ) => {
    withPermit: () => {
      execute: () => Promise<bigint>;
    };
  };
  decryptForTx: (ctHash: `0x${string}`) => {
    withPermit: () => {
      execute: () => Promise<{
        ctHash: `0x${string}`;
        decryptedValue: bigint;
        signature: `0x${string}`;
      }>;
    };
  };
  permits: {
    getOrCreateSelfPermit: (
      chainId?: number,
      account?: string,
      options?: { issuer: string }
    ) => Promise<unknown>;
  };
};

let sharedClientPromise: Promise<CofheClientLike | null> | null = null;

async function getBrowserClient() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!sharedClientPromise) {
    sharedClientPromise = (async () => {
      const [{ createCofheClient, createCofheConfig }, { sepolia: cofheSepolia }] = await Promise.all([
        import('@cofhe/sdk/web'),
        import('@cofhe/sdk/chains'),
      ]);

      return createCofheClient(
        createCofheConfig({
          environment: 'web',
          supportedChains: [cofheSepolia],
          mocks: {
            decryptDelay: 0,
            encryptDelay: [100, 100, 100, 300, 300],
          },
        })
      ) as CofheClientLike;
    })();
  }

  return sharedClientPromise;
}

function normalizeHandle(ctHash: bigint | string, utype: number): EncryptedHandle {
  return {
    ctHash:
      typeof ctHash === 'bigint'
        ? (numberToHex(ctHash, { size: 32 }) as `0x${string}`)
        : (ctHash as `0x${string}`),
    utype,
  };
}

export function useCofheClient() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [client, setClient] = useState<CofheClientLike | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function connect() {
      const nextClient = await getBrowserClient();

      if (!active) {
        return;
      }

      setClient(nextClient);

      if (!nextClient || !publicClient || !walletClient) {
        nextClient?.disconnect();
        setIsReady(false);
        return;
      }

      const adapted = await WagmiAdapter(walletClient, publicClient);
      await nextClient.connect(adapted.publicClient as never, adapted.walletClient as never);

      if (active) {
        setIsReady(true);
      }
    }

    void connect().catch(() => {
      if (active) {
        setIsReady(false);
      }
    });

    return () => {
      active = false;
    };
  }, [publicClient, walletClient]);

  const ensurePermit = async () => {
    if (!address) {
      throw new Error('Connect your wallet before using confidential actions.');
    }

    if (!client || !isReady) {
      throw new Error('CoFHE client is still connecting to the wallet.');
    }

    await client.permits.getOrCreateSelfPermit(undefined, undefined, {
      issuer: address,
    });
  };

  const encryptUint8 = async (value: number): Promise<EncryptedUint8Input> => {
    if (!client || !isReady) {
      throw new Error('CoFHE client is not ready yet.');
    }

    const [encrypted] = await client.encryptInputs([Encryptable.uint8(BigInt(value))]).execute();
    return {
      ctHash: encrypted.ctHash,
      securityZone: encrypted.securityZone,
      utype: encrypted.utype,
      signature: encrypted.signature as `0x${string}`,
    };
  };

  const decryptHandle = async (handle: EncryptedHandle) => {
    if (!client) {
      throw new Error('CoFHE client is not ready yet.');
    }

    await ensurePermit();
    const result = await client.decryptForView(handle.ctHash, handle.utype as FheTypes).withPermit().execute();
    return Number(result);
  };

  const decryptHandleForTx = async (handle: EncryptedHandle) => {
    if (!client) {
      throw new Error('CoFHE client is not ready yet.');
    }

    await ensurePermit();
    return client.decryptForTx(handle.ctHash).withPermit().execute();
  };

  return {
    client,
    isReady,
    ensurePermit,
    encryptUint8,
    decryptHandle,
    decryptHandleForTx,
    normalizeHandle,
  };
}
