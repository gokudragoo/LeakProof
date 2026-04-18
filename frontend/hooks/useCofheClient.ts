'use client';

import { useEffect, useState } from 'react';
import { Encryptable, FheTypes } from '@cofhe/sdk';
import { WagmiAdapter } from '@cofhe/sdk/adapters';
import { sepolia as cofheSepolia } from '@cofhe/sdk/chains';
import { createCofheClient, createCofheConfig } from '@cofhe/sdk/web';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { numberToHex } from 'viem';
import type { EncryptedHandle, EncryptedUint8Input } from '@/types';

const cofheClient = createCofheClient(
  createCofheConfig({
    environment: 'web',
    supportedChains: [cofheSepolia],
    mocks: {
      decryptDelay: 0,
      encryptDelay: [100, 100, 100, 300, 300],
    },
  })
);

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function connect() {
      if (!publicClient || !walletClient) {
        cofheClient.disconnect();
        if (active) {
          setIsReady(false);
        }
        return;
      }

      const adapted = await WagmiAdapter(walletClient, publicClient);
      await cofheClient.connect(adapted.publicClient, adapted.walletClient);

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

    if (!isReady) {
      throw new Error('CoFHE client is still connecting to the wallet.');
    }

    await cofheClient.permits.getOrCreateSelfPermit(undefined, undefined, {
      issuer: address,
    });
  };

  const encryptUint8 = async (value: number): Promise<EncryptedUint8Input> => {
    if (!isReady) {
      throw new Error('CoFHE client is not ready yet.');
    }

    const [encrypted] = await cofheClient.encryptInputs([Encryptable.uint8(BigInt(value))]).execute();
    return {
      ctHash: encrypted.ctHash,
      securityZone: encrypted.securityZone,
      utype: encrypted.utype,
      signature: encrypted.signature,
    };
  };

  const decryptHandle = async (handle: EncryptedHandle) => {
    await ensurePermit();
    const result = await cofheClient.decryptForView(handle.ctHash, handle.utype as FheTypes).withPermit().execute();
    return Number(result);
  };

  const decryptHandleForTx = async (handle: EncryptedHandle) => {
    await ensurePermit();
    return cofheClient.decryptForTx(handle.ctHash).withPermit().execute();
  };

  return {
    client: cofheClient,
    isReady,
    ensurePermit,
    encryptUint8,
    decryptHandle,
    decryptHandleForTx,
    normalizeHandle,
  };
}
