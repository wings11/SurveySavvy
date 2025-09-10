// World Chain token configurations
export const WORLDCHAIN_CONFIG = {
  // World Chain Mainnet
  chainId: 480,
  rpcUrl: 'https://worldchain-mainnet.g.alchemy.com/public',
  
  // WLD Token on World Chain (Official address)
  WLD_TOKEN: {
    address: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003' as `0x${string}`,
    decimals: 18,
    symbol: 'WLD',
    name: 'Worldcoin'
  },
  
  // Permit2 Contract (Universal - same on all chains)
  PERMIT2_ADDRESS: '0xF0882554ee924278806d708396F1a7975b732522' as `0x${string}`,
  
  // Platform configuration
  MARKS_TO_WLD_RATE: 100, // 100 marks = 1 WLD (so 500 marks = 5 WLD)
  PLATFORM_FEE_PERCENT: 20, // 20% platform fee
  MIN_WITHDRAWAL_MARKS: 500,
  WITHDRAWAL_MULTIPLE: 500,
  MAX_MARKS_CAP: 500 // Maximum marks a user can hold
} as const;

// WLD Token ABI (ERC-20 standard functions we need)
export const WLD_TOKEN_ABI = [
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Permit2 ABI for signature-based transfers
export const PERMIT2_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            name: 'permitted',
            type: 'tuple'
          },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ],
        name: 'permit',
        type: 'tuple'
      },
      {
        components: [
          { name: 'to', type: 'address' },
          { name: 'requestedAmount', type: 'uint256' }
        ],
        name: 'transferDetails',
        type: 'tuple'
      },
      { name: 'signature', type: 'bytes' }
    ],
    name: 'permitTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;
