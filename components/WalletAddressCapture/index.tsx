"use client";

import { useState } from 'react';
import { FiCreditCard, FiLoader, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface WalletAddressCaptureProps {
  onWalletCaptured: (address: string) => void;
  onError?: (error: string) => void;
}

export const WalletAddressCapture = ({ onWalletCaptured, onError }: WalletAddressCaptureProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [walletInput, setWalletInput] = useState<string>('');

  const validateWalletAddress = (address: string): boolean => {
    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  const handleSaveWalletAddress = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!walletInput.trim()) {
        throw new Error('Please enter your wallet address');
      }

      if (!validateWalletAddress(walletInput.trim())) {
        throw new Error('Invalid wallet address format. Please enter a valid Ethereum address (0x...)');
      }

      // Validate that it's a proper length
      const cleanAddress = walletInput.trim();
      if (cleanAddress.length !== 42) {
        throw new Error('Wallet address must be exactly 42 characters long');
      }

      onWalletCaptured(cleanAddress);
      
    } catch (error) {
      console.error('Wallet address save error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save wallet address';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <FiCreditCard className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-blue-900">Enter Your Wallet Address</h3>
      </div>
      
      <p className="text-sm text-blue-700 mb-4">
        Please enter your World App wallet address to enable automatic withdrawals. You can find this in your World App wallet.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">
            Wallet Address
          </label>
          <input
            type="text"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono break-all"
            disabled={isLoading}
          />
          <div className="text-xs text-blue-600 mt-1 break-all">
            Example: 0x1234567890123456789012345678901234567890
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <FiAlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleSaveWalletAddress}
          disabled={isLoading || !walletInput.trim()}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FiCheck className="h-4 w-4" />
              Save Wallet Address
            </>
          )}
        </button>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-xs text-yellow-800">
          <strong>How to find your wallet address:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Open World App</li>
            <li>Go to World ID page.</li>
            <li>Click Setting Icon and Wallet</li>
            <li>Tap on &quot;Receive&quot; or wallet address</li>
            <li className="break-words">Copy the address (starts with 0x)</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
