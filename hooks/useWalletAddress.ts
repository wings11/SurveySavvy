"use client";

import { useState, useEffect, useCallback } from 'react';
import { getUserWalletAddress } from '@/lib/minikit/wallet';

interface UseWalletAddressReturn {
  walletAddress: string | null;
  isLoading: boolean;
  error: string | null;
  refreshWalletAddress: () => Promise<void>;
  updateWalletAddress: (address: string) => Promise<void>;
}

export function useWalletAddress(): UseWalletAddressReturn {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletFromServer = useCallback(async () => {
    try {
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();
      
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch('/api/user/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.walletAddress;
      }
      return null;
    } catch (err) {
      console.error('Error fetching wallet from server:', err);
      return null;
    }
  }, []);

  const fetchWalletFromMiniKit = useCallback(async () => {
    try {
      return await getUserWalletAddress();
    } catch (err) {
      console.error('Error fetching wallet from MiniKit:', err);
      return null;
    }
  }, []);

  const updateWalletAddress = useCallback(async (address: string) => {
    try {
      setError(null);
      
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();
      
      if (!token) {
        throw new Error('No auth token available');
      }

      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ walletAddress: address })
      });

      if (response.ok) {
        setWalletAddress(address);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update wallet address');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const refreshWalletAddress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get from server first
      let address = await fetchWalletFromServer();
      
      // If not found in server, try MiniKit
      if (!address) {
        address = await fetchWalletFromMiniKit();
        
        // If found in MiniKit, update server
        if (address) {
          try {
            await updateWalletAddress(address);
          } catch (updateError) {
            console.error('Failed to sync wallet to server:', updateError);
            // Continue anyway - we have the address
          }
        }
      }

      setWalletAddress(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet address');
    } finally {
      setIsLoading(false);
    }
  }, [fetchWalletFromServer, fetchWalletFromMiniKit, updateWalletAddress]);

  useEffect(() => {
    refreshWalletAddress();
  }, [refreshWalletAddress]);

  return {
    walletAddress,
    isLoading,
    error,
    refreshWalletAddress,
    updateWalletAddress
  };
}
