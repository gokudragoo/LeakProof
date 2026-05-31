import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACTS, isContractConfigured } from '@/lib/contracts';

export const runtime = 'nodejs';

const MODULES = [
  ['accessControl', CONTRACTS.ACCESS_CONTROL],
  ['core', CONTRACTS.CORE],
  ['reviewerHub', CONTRACTS.REVIEWER_HUB],
  ['disclosureCtrl', CONTRACTS.DISCLOSURE_CTRL],
  ['token', CONTRACTS.TOKEN],
  ['reputation', CONTRACTS.REPUTATION],
  ['timeLocked', CONTRACTS.TIMELOCKED],
  ['dao', CONTRACTS.DAO],
] as const;

const HEALTH_TIMEOUT_MS = 7_000;

function withTimeout<T>(promise: Promise<T>, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${HEALTH_TIMEOUT_MS}ms`)), HEALTH_TIMEOUT_MS);
    }),
  ]);
}

export async function GET() {
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com';
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl, { retryCount: 1, timeout: 5_000 }),
  });

  try {
    const [chainId, latestBlock, modules] = await withTimeout(Promise.all([
      publicClient.getChainId(),
      publicClient.getBlockNumber(),
      Promise.all(
        MODULES.map(async ([name, address]) => {
          if (!isContractConfigured(address)) {
            return { name, address, state: 'unconfigured' };
          }

          const bytecode = await publicClient.getBytecode({ address });
          return {
            name,
            address,
            state: bytecode && bytecode !== '0x' ? 'live' : 'missing',
            bytecodeSize: bytecode && bytecode !== '0x' ? (bytecode.length - 2) / 2 : 0,
          };
        })
      ),
    ]), 'Sepolia health check');

    const ready = modules.every((module) => module.state === 'live');

    return Response.json(
      {
        status: ready ? 'ok' : 'degraded',
        checkedAt: new Date().toISOString(),
        chainId,
        latestBlock: latestBlock.toString(),
        modules,
      },
      { status: ready ? 200 : 503 }
    );
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        checkedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown health check failure',
      },
      { status: 503 }
    );
  }
}
