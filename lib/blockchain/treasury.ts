import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { WORLDCHAIN_CONFIG, WLD_TOKEN_ABI } from '@/lib/constants/tokens';

// Custom minimal chain object (since we only need id + rpc)
const worldChain = {
  id: WORLDCHAIN_CONFIG.chainId,
  name: 'World Chain',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [WORLDCHAIN_CONFIG.rpcUrl] },
    public: { http: [WORLDCHAIN_CONFIG.rpcUrl] }
  }
} as const;

function getAccount() {
  const pk = process.env.TREASURY_PRIVATE_KEY;
  if (!pk) {
    throw new Error('Treasury private key not configured (TREASURY_PRIVATE_KEY)');
  }
  const normalized = pk.startsWith('0x') ? pk : `0x${pk}`;
  return privateKeyToAccount(normalized as `0x${string}`);
}

let walletClientCache: ReturnType<typeof createWalletClient> | null = null;

function getWalletClient() {
  if (walletClientCache) return walletClientCache;
  const account = getAccount();
  walletClientCache = createWalletClient({
    account,
    chain: worldChain,
    transport: http(WORLDCHAIN_CONFIG.rpcUrl)
  });
  return walletClientCache;
}

export async function sendWldToUser(userAddress: `0x${string}`, amountWei: bigint) {
  if (amountWei === (0 as unknown as bigint)) {
    throw new Error('Amount must be greater than zero');
  }
  const walletClient = getWalletClient();
  // Execute ERC20 transfer
  const hash = await (walletClient as any).writeContract({
    address: WORLDCHAIN_CONFIG.WLD_TOKEN.address,
    abi: WLD_TOKEN_ABI,
    functionName: 'transfer',
    args: [userAddress, amountWei],
    chain: worldChain
  });
  return hash; // transaction hash
}
