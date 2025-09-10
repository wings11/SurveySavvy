"use client";

import { useState, useEffect } from 'react';
import { FiArrowDown, FiLoader, FiCheck, FiAlertCircle, FiCreditCard, FiEdit3 } from 'react-icons/fi';
import { WORLDCHAIN_CONFIG } from '@/lib/constants/tokens';
import { 
  calculateWldAmount, 
  validateWithdrawalAmount, 
  validateWalletAddress
} from '@/lib/utils/withdrawal';
import { WalletAddressCapture } from '@/components/WalletAddressCapture';


interface AutomaticWithdrawalProps {
  userMarks: number;
  onWithdrawalComplete?: () => void;
}

export default function AutomaticWithdrawal({ 
  userMarks, 
  onWithdrawalComplete 
}: AutomaticWithdrawalProps) {
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(WORLDCHAIN_CONFIG.MIN_WITHDRAWAL_MARKS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showWalletCapture, setShowWalletCapture] = useState(false);

  // Load saved wallet address from user profile
  useEffect(() => {
    const loadWalletAddress = async () => {
      try {
        const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
        const { token } = await authRes.json();
        
        if (token) {
          const response = await fetch('/api/user/wallet', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.walletAddress) {
              setWalletAddress(data.walletAddress);
            } else {
              setShowWalletCapture(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading wallet address:', error);
        setShowWalletCapture(true);
      }
    };

    loadWalletAddress();
  }, []);

  // Calculate withdrawal details
  const withdrawalDetails = calculateWldAmount(withdrawalAmount);

  const handleWalletCaptured = async (address: string) => {
    try {
      setWalletAddress(address);
      setShowWalletCapture(false);
      
      // Save wallet address to user profile
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();
      
      if (token) {
        await fetch('/api/user/wallet', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ walletAddress: address })
        });
      }
    } catch (error) {
      console.error('Error saving wallet address:', error);
      setError('Failed to save wallet address');
    }
  };

  const handleWithdraw = async () => {
    try {
      setError('');
      setSuccess('');
      setIsProcessing(true);

      // Validate inputs
      const amountValidation = validateWithdrawalAmount(withdrawalAmount);
      if (!amountValidation.isValid) {
        throw new Error(amountValidation.error);
      }

      if (!walletAddress) {
        throw new Error('Wallet address required. Please capture your wallet address first.');
      }

      const addressValidation = validateWalletAddress(walletAddress);
      if (!addressValidation.isValid) {
        throw new Error(addressValidation.error);
      }

      // Check if user has enough marks
      if (withdrawalAmount > userMarks) {
        throw new Error(`Insufficient marks. You have ${userMarks} marks available.`);
      }

      // Get auth token
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();
      
      if (!token) {
        throw new Error('Authentication failed');
      }

      // Request server-side treasury payout
      const deadline = Math.floor((Date.now() + 30 * 60 * 1000) / 1000);
      const nonce = Date.now().toString();

      const withdrawalResponse = await fetch('/api/withdraw/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          marks: withdrawalAmount,
          walletAddress: walletAddress,
          deadline,
          nonce
        })
      });

      if (!withdrawalResponse.ok) {
        const errorData = await withdrawalResponse.json();
        throw new Error(errorData.error || 'Failed to initiate withdrawal');
      }

      const { txHash } = await withdrawalResponse.json();
      setTxHash(txHash);
      setSuccess('Withdrawal completed. On-chain tx broadcasted.');
      onWithdrawalComplete?.();

    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <FiArrowDown className="h-5 w-5 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Automatic Withdrawal</h2>
      </div>

      {/* Available Marks */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-600">Available Marks</div>
        <div className="text-2xl font-bold text-green-600">{userMarks.toLocaleString()}</div>
      </div>

      {/* Wallet Address Section */}
      {showWalletCapture ? (
        <div className="mb-6">
          <WalletAddressCapture 
            onWalletCaptured={handleWalletCaptured}
            onError={(error) => setError(error)}
          />
        </div>
      ) : walletAddress ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiCreditCard className="inline h-4 w-4 mr-1" />
            Your Wallet Address
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
            <div className="space-y-2">
              <div className="text-sm font-mono text-gray-800 break-all overflow-hidden">
                {walletAddress}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-600">
                  ✓ Wallet address captured
                </div>
                <button
                  onClick={() => setShowWalletCapture(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 flex-shrink-0"
                >
                  <FiEdit3 className="h-3 w-3" />
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Withdrawal Form */}
      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Withdrawal Amount (Marks)
          </label>
          <input
            type="number"
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
            min={WORLDCHAIN_CONFIG.MIN_WITHDRAWAL_MARKS}
            step={WORLDCHAIN_CONFIG.WITHDRAWAL_MULTIPLE}
            max={userMarks}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={`Minimum ${WORLDCHAIN_CONFIG.MIN_WITHDRAWAL_MARKS} marks`}
          />
          <div className="text-xs text-gray-500 mt-1">
            Must be a multiple of {WORLDCHAIN_CONFIG.WITHDRAWAL_MULTIPLE} marks
          </div>
        </div>

        {/* Withdrawal Details */}
        {withdrawalAmount >= WORLDCHAIN_CONFIG.MIN_WITHDRAWAL_MARKS && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gross WLD:</span>
              <span className="font-medium">{withdrawalDetails.grossWld.toFixed(6)} WLD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee (20%):</span>
              <span className="font-medium text-red-600">-{withdrawalDetails.platformFee.toFixed(6)} WLD</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span className="text-gray-800">Net WLD:</span>
              <span className="text-green-600">{withdrawalDetails.netWld.toFixed(6)} WLD</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <FiAlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <FiCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Transaction Status */}
        {txHash && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FiCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-blue-700">Broadcasted</span>
            </div>
            <div className="text-xs text-blue-600 break-all">
              Tx Hash: {txHash}
            </div>
          </div>
        )}

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={
            isProcessing || 
            withdrawalAmount < WORLDCHAIN_CONFIG.MIN_WITHDRAWAL_MARKS || 
            withdrawalAmount > userMarks ||
            !walletAddress
          }
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing && (
            <FiLoader className="h-4 w-4 animate-spin" />
          )}
          {isProcessing ? 'Processing...' : 'Withdraw WLD'}
        </button>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>Withdrawal executed directly from platform treasury.</div>
          <div>WLD will appear in your World App after network confirmation.</div>
          {!walletAddress && (
            <div className="text-orange-600">
              💡 Tip: Capture your wallet address first to enable withdrawals
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
