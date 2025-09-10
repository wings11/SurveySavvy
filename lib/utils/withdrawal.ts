import { WORLDCHAIN_CONFIG } from '@/lib/constants/tokens';

/**
 * Calculate WLD amount from marks with platform fee
 */
export function calculateWldAmount(marks: number): {
  grossWld: number;
  platformFee: number;
  netWld: number;
  netWldWei: bigint;
} {
  // Base calculation: marks to WLD
  const grossWld = marks / WORLDCHAIN_CONFIG.MARKS_TO_WLD_RATE;
  
  // Apply platform fee
  const platformFee = grossWld * (WORLDCHAIN_CONFIG.PLATFORM_FEE_PERCENT / 100);
  const netWld = grossWld - platformFee;
  
  // Convert to Wei (18 decimals) - used for server-side transfer
  const netWldWei = BigInt(Math.floor(netWld * 1e18));
  
  return {
    grossWld,
    platformFee,
    netWld,
    netWldWei
  };
}

/**
 * Validate withdrawal amount
 */
export function validateWithdrawalAmount(marks: number): {
  isValid: boolean;
  error?: string;
} {
  if (marks < WORLDCHAIN_CONFIG.MIN_WITHDRAWAL_MARKS) {
    return {
      isValid: false,
      error: `Minimum withdrawal is ${WORLDCHAIN_CONFIG.MIN_WITHDRAWAL_MARKS} marks`
    };
  }
  
  if (marks % WORLDCHAIN_CONFIG.WITHDRAWAL_MULTIPLE !== 0) {
    return {
      isValid: false,
      error: `Withdrawal amount must be a multiple of ${WORLDCHAIN_CONFIG.WITHDRAWAL_MULTIPLE} marks`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate marks cap for awarding marks
 */
export function validateMarksCap(currentMarks: number, marksToAdd: number): {
  isValid: boolean;
  actualMarksToAward: number;
  error?: string;
} {
  const maxMarks = WORLDCHAIN_CONFIG.MAX_MARKS_CAP;
  const availableSpace = Math.max(0, maxMarks - currentMarks);
  const actualMarksToAward = Math.min(marksToAdd, availableSpace);
  
  if (currentMarks >= maxMarks) {
    return {
      isValid: false,
      actualMarksToAward: 0,
      error: `You have reached the maximum marks limit (${maxMarks} marks)`
    };
  }
  
  if (actualMarksToAward < marksToAdd) {
    return {
      isValid: true,
      actualMarksToAward,
      error: `Can only add ${actualMarksToAward} marks (current: ${currentMarks}/${maxMarks})`
    };
  }
  
  return {
    isValid: true,
    actualMarksToAward
  };
}

/**
 * Validate wallet address
 */
export function validateWalletAddress(address: string): {
  isValid: boolean;
  error?: string;
} {
  if (!address) {
    return {
      isValid: false,
      error: 'Wallet address is required'
    };
  }
  
  if (!address.startsWith('0x') || address.length !== 42) {
    return {
      isValid: false,
      error: 'Invalid wallet address format'
    };
  }
  
  return { isValid: true };
}

/**
 * Generate Permit2 transfer parameters
 */
export function generatePermit2Params(
  tokenAddress: string,
  amount: bigint,
  to: string,
  deadline: number,
  nonce: string
) {
  return {
    permitted: {
      token: tokenAddress,
      amount: amount.toString()
    },
    nonce,
    deadline: deadline.toString(),
    spender: WORLDCHAIN_CONFIG.PERMIT2_ADDRESS,
    transferDetails: {
      to,
      requestedAmount: amount.toString()
    }
  };
}
