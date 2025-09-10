"use client";

import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import { WORLDCHAIN_CONFIG, PERMIT2_ABI } from '@/lib/constants/tokens';
import { calculateWldAmount, validateWithdrawalAmount, validateWalletAddress } from '@/lib/utils/withdrawal';

interface WithdrawMarksProps {
  userMarks: number;
  onWithdrawalComplete: () => void;
}

export function WithdrawMarks({ userMarks, onWithdrawalComplete }: WithdrawMarksProps) {
  const [marksToWithdraw, setMarksToWithdraw] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Viem client for World Chain
  const client = createPublicClient({
    chain: worldchain,
    transport: http(WORLDCHAIN_CONFIG.rpcUrl),
  });

  // Monitor transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({
    client,
    appConfig: {
      app_id: process.env.NEXT_PUBLIC_WLD_CLIENT_ID!,
    },
    transactionId,
  });

  // Handle withdrawal submission
  const handleWithdraw = async () => {
    try {
      setError('');
      setSuccess('');
      setIsProcessing(true);

      const marks = parseInt(marksToWithdraw);
      
      // Validate inputs
      const marksValidation = validateWithdrawalAmount(marks);
      if (!marksValidation.isValid) {
        setError(marksValidation.error!);
        return;
      }

      const addressValidation = validateWalletAddress(walletAddress);
      if (!addressValidation.isValid) {
        setError(addressValidation.error!);
        return;
      }

      if (marks > userMarks) {
        setError(`Insufficient marks. You have ${userMarks} marks but requested ${marks}`);
        return;
      }

      // Calculate WLD amounts
      const { netWld, netWldWei, platformFee } = calculateWldAmount(marks);

      // Create Permit2 parameters
      const deadline = Math.floor((Date.now() + 30 * 60 * 1000) / 1000); // 30 minutes
      const nonce = Date.now().toString();

      const permitTransfer = {
        permitted: {
          token: WORLDCHAIN_CONFIG.WLD_TOKEN.address,
          amount: netWldWei.toString(),
        },
        nonce,
        deadline: deadline.toString(),
      };

      const transferDetails = {
        to: walletAddress as `0x${string}`,
        requestedAmount: netWldWei.toString(),
      };

      console.log('Initiating withdrawal transaction...', {
        marks,
        netWld,
        platformFee,
        walletAddress
      });

      // Send transaction via MiniKit
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: WORLDCHAIN_CONFIG.PERMIT2_ADDRESS,
            abi: PERMIT2_ABI,
            functionName: 'permitTransferFrom',
            args: [
              [
                [
                  permitTransfer.permitted.token,
                  permitTransfer.permitted.amount,
                ],
                permitTransfer.nonce,
                permitTransfer.deadline,
              ],
              [transferDetails.to, transferDetails.requestedAmount],
              'PERMIT2_SIGNATURE_PLACEHOLDER_0', // Auto-replaced by MiniKit
            ],
          },
        ],
        permit2: [
          {
            ...permitTransfer,
            spender: WORLDCHAIN_CONFIG.PERMIT2_ADDRESS,
          },
        ],
      });

      if (finalPayload.status === 'error') {
        throw new Error(finalPayload.error_code || 'Transaction failed');
      }

      // Record withdrawal in database
      const response = await fetch('/api/process-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          marksToWithdraw: marks,
          walletAddress,
          wldAmount: netWld,
          wldAmountWei: netWldWei.toString(),
          platformFee,
          permit2Nonce: nonce,
          transactionId: finalPayload.transaction_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process withdrawal');
      }

      setTransactionId(finalPayload.transaction_id);
      setSuccess(`Withdrawal initiated! You'll receive ${netWld.toFixed(6)} WLD`);
      
      // Clear form
      setMarksToWithdraw('');
      setWalletAddress('');

    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle transaction confirmation
  if (isConfirmed && transactionId) {
    setSuccess('Withdrawal completed successfully!');
    setTransactionId('');
    onWithdrawalComplete();
  }

  if (txError) {
    setError('Transaction failed: ' + txError.message);
    setTransactionId('');
  }

  const marks = parseInt(marksToWithdraw) || 0;
  const { netWld, platformFee } = calculateWldAmount(marks);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Withdraw Marks</h3>
      
      <div className="space-y-4">
        {/* Current Balance */}
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">Available Marks</p>
          <p className="text-2xl font-bold text-blue-600">{userMarks.toLocaleString()}</p>
        </div>

        {/* Withdrawal Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marks to Withdraw
          </label>
          <input
            type="number"
            value={marksToWithdraw}
            onChange={(e) => setMarksToWithdraw(e.target.value)}
            placeholder={`Minimum ${WORLDCHAIN_CONFIG.MIN_WITHDRAWAL_MARKS}`}
            min={WORLDCHAIN_CONFIG.MIN_WITHDRAWAL_MARKS}
            step={WORLDCHAIN_CONFIG.WITHDRAWAL_MULTIPLE}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing || isConfirming}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must be a multiple of {WORLDCHAIN_CONFIG.WITHDRAWAL_MULTIPLE}
          </p>
        </div>

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wallet Address
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing || isConfirming}
          />
        </div>

        {/* Calculation Preview */}
        {marks > 0 && (
          <div className="bg-blue-50 p-3 rounded space-y-1">
            <div className="flex justify-between text-sm">
              <span>Gross WLD:</span>
              <span>{(marks / WORLDCHAIN_CONFIG.MARKS_TO_WLD_RATE).toFixed(6)} WLD</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform Fee ({WORLDCHAIN_CONFIG.PLATFORM_FEE_PERCENT}%):</span>
              <span>-{platformFee.toFixed(6)} WLD</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-1">
              <span>You&apos;ll Receive:</span>
              <span>{netWld.toFixed(6)} WLD</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleWithdraw}
          disabled={
            !marksToWithdraw || 
            !walletAddress || 
            isProcessing || 
            isConfirming ||
            parseInt(marksToWithdraw) > userMarks
          }
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : isConfirming ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Confirming...
            </>
          ) : (
            'Withdraw WLD'
          )}
        </button>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Withdrawals are processed instantly via Permit2</p>
          <p>• Platform fee: {WORLDCHAIN_CONFIG.PLATFORM_FEE_PERCENT}% of gross amount</p>
          <p>• Rate: {WORLDCHAIN_CONFIG.MARKS_TO_WLD_RATE} marks = 1 WLD</p>
        </div>
      </div>
    </div>
  );
}
