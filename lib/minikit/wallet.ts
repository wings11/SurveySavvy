"use client";

import { MiniKit } from "@worldcoin/minikit-js";

/**
 * Get user's wallet address from MiniKit
 * This function attempts multiple strategies to get the wallet address
 */
export async function getUserWalletAddress(): Promise<string | null> {
  try {
    if (!MiniKit.isInstalled()) {
      console.log('MiniKit is not installed');
      return null;
    }

    // Strategy 1: Check if user object has wallet address
    const user = MiniKit.user;
    if (user) {
      // Check if wallet address is directly available
      if ((user as any).walletAddress) {
        return (user as any).walletAddress;
      }
      
      // Check if address is in user object
      if ((user as any).address) {
        return (user as any).address;
      }
    }

    // Strategy 2: Try to get from a minimal transaction to trigger wallet access
    // This is a common pattern - trigger wallet connection through transaction
    try {
      // Note: This might prompt user for wallet access
      // We'll implement this in the actual transaction flow instead
      console.log('Wallet address not immediately available from MiniKit user object');
    } catch (error) {
      console.log('Could not trigger wallet access:', error);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting wallet address from MiniKit:', error);
    return null;
  }
}

/**
 * Extract wallet address from MiniKit transaction result
 * This is called after a successful transaction to capture the wallet address
 */
export function extractWalletFromTransaction(transactionResult: any): string | null {
  try {
    // Check various possible locations for wallet address in transaction result
    if (transactionResult?.from) {
      return transactionResult.from;
    }
    
    if (transactionResult?.finalPayload?.from) {
      return transactionResult.finalPayload.from;
    }
    
    if (transactionResult?.payload?.from) {
      return transactionResult.payload.from;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting wallet from transaction:', error);
    return null;
  }
}

/**
 * Get user data from MiniKit including sign-in status
 */
export function getUserDataFromMiniKit() {
  try {
    if (!MiniKit.isInstalled()) {
      return {
        walletAddress: null,
        hasWallet: false,
        isSignedIn: false,
        userData: null
      };
    }

    const user = MiniKit.user;
    const walletAddress = getUserWalletAddress();
    
    return {
      walletAddress: walletAddress || null,
      hasWallet: !!walletAddress,
      isSignedIn: !!user,
      userData: user
    };
  } catch (error) {
    console.error('Error getting user data from MiniKit:', error);
    return {
      walletAddress: null,
      hasWallet: false,
      isSignedIn: false,
      userData: null
    };
  }
}

/**
 * Check if user has connected their wallet
 */
export async function isWalletConnected(): Promise<boolean> {
  try {
    const address = await getUserWalletAddress();
    return !!address;
  } catch {
    return false;
  }
}
