"use client";
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from "@worldcoin/minikit-js";
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getPaymentAddress } from '@/lib/payment-config';
import { WithdrawMarks } from '../WithdrawMarks';
import AutomaticWithdrawal from '../AutomaticWithdrawal';
import { 
  HiCurrencyDollar,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiStop,
  HiLockClosed,
  HiLightningBolt,
  HiDownload,
  HiUpload
} from 'react-icons/hi';

interface MarksPackage {
  id: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';
  marks: number;
  wldPrice: number;
  description: string;
  savings?: string;
}

const MARKS_PACKAGES: MarksPackage[] = [
  {
    id: 'tiny',
    marks: 10,
    wldPrice: 0.1,
    description: '10 marks for 0.1 WLD'
  },
  {
    id: 'small',
    marks: 50,
    wldPrice: 0.5,
    description: '50 marks for 0.5 WLD'
  },
  {
    id: 'medium',
    marks: 250,
    wldPrice: 2.375,
    description: '250 marks for 2.375 WLD',
    savings: '5% OFF'
  },
  {
    id: 'large', 
    marks: 500,
    wldPrice: 4.5,
    description: '500 marks for 4.5 WLD',
    savings: '10% OFF'
  },
  {
    id: 'xlarge',
    marks: 1000,
    wldPrice: 8.0,
    description: '1000 marks for 8.0 WLD', 
    savings: '20% OFF'
  }
];

const sendMarksPurchasePayment = async (packageInfo: MarksPackage) => {
  try {
    const res = await fetch(`/api/initiate-payment`, {
      method: "POST",
    });

    const { id } = await res.json();

    const payload: PayCommandInput = {
      reference: id,
      to: getPaymentAddress(),
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(packageInfo.wldPrice, Tokens.WLD).toString(),
        },
      ],
      description: `Purchase ${packageInfo.marks} marks - ${packageInfo.description}`,
    };

    if (MiniKit.isInstalled()) {
      return await MiniKit.commandsAsync.pay(payload);
    }
    return null;
  } catch (error: unknown) {
    console.log("Error sending payment", error);
    return null;
  }
};

const handleMarksPurchase = async (
  packageInfo: MarksPackage,
  setStatus: (s: string) => void,
  setError: (e: string | null) => void,
  onSuccess: () => void
) => {
  if (!MiniKit.isInstalled()) {
    setError("MiniKit is not installed");
    return;
  }

  setStatus("initiating");
  setError(null);

  const sendPaymentResponse = await sendMarksPurchasePayment(packageInfo);
  const response = sendPaymentResponse?.finalPayload;
  
  if (!response) {
    setStatus("cancelled");
    return;
  }

  if (response.status === "success") {
    setStatus("confirming");
    
    try {
      // Get auth token for API call
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();
      
      if (!token) {
        setStatus("failed");
        setError("Authentication failed");
        return;
      }

      // Record the marks purchase
      const purchaseRes = await fetch('/api/purchase-marks/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId: `marks_${packageInfo.id}`,
          paymentReference: response.reference,
          transactionId: response.transaction_id,
          amount: packageInfo.wldPrice
        })
      });

      const purchaseResult = await purchaseRes.json();
      
      if (purchaseResult.success) {
        setStatus("success");
        setError(null);
        onSuccess();
      } else {
        setStatus("failed");
        setError(purchaseResult.error || "Purchase verification failed");
      }
    } catch (error) {
      setStatus("failed");
      setError("Failed to record purchase");
    }
  } else if (response.status === 'error') {
    setStatus("failed");
    setError("Payment failed");
  }
};

export function MarksManager() {
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentMarks, setCurrentMarks] = useState(0);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  // Fetch current marks balance
  const fetchMarksBalance = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();
      
      const userRes = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentMarks(userData.totalMarks || 0);
      }
    } catch (error) {
      console.error('Error fetching marks balance:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchMarksBalance();
  }, [fetchMarksBalance]);

  const handlePurchaseSuccess = () => {
    fetchMarksBalance(); // Refresh balance after purchase
    setStatus("idle");
    setError(null);
  };

  if (!session) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Marks Manager</h3>
        <p className="text-gray-600 mb-4">Connect wallet to purchase marks</p>
        <div className="text-sm text-gray-500">Boost your surveys with premium currency</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <span className="text-2xl">✨</span>
          <h2 className="text-lg font-bold text-gray-900">Marks</h2>
        </div>
        {currentMarks !== null && (
          <div className="inline-flex items-center space-x-2 bg-white/50 rounded-full px-4 py-2">
            <span className="text-sm text-gray-600">Balance:</span>
            <span className="font-bold text-yellow-600">
              {loading ? '...' : currentMarks}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Packages */}
        <div className="space-y-3 mb-6">
          {MARKS_PACKAGES.map((pkg) => {
            const isDisabled = status === 'initiating' || status === 'confirming';

            return (
              <div key={pkg.id} className="relative rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 hover:border-yellow-300 hover:shadow-md transition-all duration-200">
                {/* Savings badge */}
                {pkg.savings && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {pkg.savings}
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                        <span className="font-bold">{pkg.marks}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {pkg.marks} Marks
                        </div>
                        <div className="text-sm text-gray-600">{pkg.wldPrice} WLD</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleMarksPurchase(pkg, setStatus, setError, handlePurchaseSuccess)}
                      disabled={isDisabled}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'} ${isDisabled ? 'opacity-50' : ''}`}
                    >
                      {status === 'initiating' || status === 'confirming' ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing</span>
                        </div>
                      ) : (
                        <span>Buy</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Display */}
        {(status !== 'idle' || error) && (
          <div className={`mb-4 p-4 rounded-xl text-center ${
            status === 'success' || status === 'withdrawal_success' ? 'bg-green-50 text-green-700 border border-green-200' :
            status === 'failed' || error ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              <span>
                {(status === 'success' || status === 'withdrawal_success') && <HiCheckCircle className="w-5 h-5 text-green-600" />}
                {(status === 'failed' || error) && <HiXCircle className="w-5 h-5 text-red-600" />}
                {status === 'cancelled' && <HiStop className="w-5 h-5 text-gray-600" />}
                {(status === 'initiating' || status === 'confirming') && <HiClock className="w-5 h-5 text-blue-600 animate-spin" />}
              </span>
              <span className="font-medium">
                {status === 'initiating' && 'Initiating payment...'}
                {status === 'confirming' && 'Confirming purchase...'}
                {status === 'success' && 'Marks purchased successfully!'}
                {status === 'withdrawal_success' && 'Withdrawal request submitted! You will receive WLD within 24-48 hours.'}
                {status === 'cancelled' && 'Payment cancelled'}
                {(status === 'failed' || error) && (error || 'Operation failed')}
              </span>
            </div>
          </div>
        )}

        {/* Withdrawal Section */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <AutomaticWithdrawal 
            userMarks={currentMarks} 
            onWithdrawalComplete={fetchMarksBalance}
          />
        </div>

        {/* Info */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <HiLockClosed className="w-4 h-4" />
              <span>Secure WLD payments</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <HiLightningBolt className="w-4 h-4" />
              <span>Instant delivery</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <HiUpload className="w-4 h-4" />
              <span>Withdrawable anytime</span>
            </div>
          </div>
        </div>

        {/* Usage Info */}
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>• Use marks to boost your surveys for higher visibility</p>
          <p>• Boosted surveys appear at the top of the feed</p>
          <p>• Helpers earn both points and marks from boosted surveys</p>
          <p>• 20% commission goes to platform maintenance</p>
        </div>
      </div>
    </div>
  );
}
