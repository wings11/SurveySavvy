"use client";
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from "@worldcoin/minikit-js";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getPaymentAddress, getPointPackages } from "../../lib/payment-config";
import { 
  HiCurrencyDollar,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiStop,
  HiLockClosed,
  HiLightningBolt
} from 'react-icons/hi';

interface PointPackage {
  id: 'daily' | 'weekly';
  points: number;
  wldPrice: number;
  description: string;
  cooldownDays: number;
}

const POINT_PACKAGES = getPointPackages();

const sendPointPurchasePayment = async (packageInfo: PointPackage) => {
  try {
    const res = await fetch(`/api/initiate-payment`, {
      method: "POST",
    });

    const { id } = await res.json();

    const payload: PayCommandInput = {
      reference: id,
      to: getPaymentAddress(), // Use configurable payment address
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(packageInfo.wldPrice, Tokens.WLD).toString(),
        },
      ],
      description: `Purchase ${packageInfo.points} points - ${packageInfo.description}`,
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

const handlePointPurchase = async (
  packageInfo: PointPackage,
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

  const sendPaymentResponse = await sendPointPurchasePayment(packageInfo);
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

      // Record the point purchase
      const purchaseRes = await fetch('/api/purchase-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pointPackage: packageInfo.id,
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

export const PointPurchase = () => {
  const { data: session } = useSession();
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<{
    canPurchaseDaily: boolean;
    canPurchaseWeekly: boolean;
    dailyPurchasesToday: number;
    lastWeeklyPurchase: string | null;
    daysUntilNextPurchase: number;
  } | null>(null);

  const fetchUserData = async () => {
    if (!session) return;
    
    try {
      const authRes = await fetch('/api/auth/bridge', { method: 'POST' });
      const { token } = await authRes.json();
      
      if (token) {
        // Get user points
        const userRes = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await userRes.json();
        setUserPoints(user.totalPoints || 0);

        // Get purchase eligibility
        const eligibilityRes = await fetch('/api/purchase-points/eligibility', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const eligibility = await eligibilityRes.json();
        setPurchaseStatus(eligibility);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUserData();
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePurchaseSuccess = () => {
    fetchUserData(); // Refresh data after purchase
  };

  if (!session) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <HiCurrencyDollar className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Get Points</h3>
        <p className="text-gray-600 mb-4">Connect wallet to purchase points</p>
        <div className="text-sm text-gray-500">Points unlock survey creation</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <HiCurrencyDollar className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Points</h2>
        </div>
        {userPoints !== null && (
          <div className="inline-flex items-center space-x-2 bg-white/50 rounded-full px-4 py-2">
            <span className="text-sm text-gray-600">Balance:</span>
            <span className="font-bold text-blue-600">{userPoints}</span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Packages */}
        <div className="space-y-3 mb-6">
          {POINT_PACKAGES.map((pkg) => {
            const isEligible = pkg.id === 'daily' ? 
              purchaseStatus?.canPurchaseDaily : 
              purchaseStatus?.canPurchaseWeekly;
            
            const isDisabled = !isEligible || status === 'initiating' || status === 'confirming';

            return (
              <div key={pkg.id} className={`relative rounded-xl border-2 transition-all duration-200 ${
                isEligible 
                  ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 hover:border-blue-300 hover:shadow-md' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                {/* Badge for weekly package */}
                {pkg.id === 'weekly' && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    15% OFF
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        pkg.id === 'daily' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        <span className="font-bold">{pkg.points}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {pkg.id === 'daily' ? 'Daily Pack' : 'Weekly Bundle'}
                        </div>
                        <div className="text-sm text-gray-600">{pkg.wldPrice} WLD</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handlePointPurchase(pkg, setStatus, setError, handlePurchaseSuccess)}
                      disabled={isDisabled}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isEligible 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      } ${isDisabled ? 'opacity-50' : ''}`}
                    >
                      {status === 'initiating' || status === 'confirming' ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing</span>
                        </div>
                      ) : (
                        <span>{isEligible ? 'Buy' : 'Cooldown'}</span>
                      )}
                    </button>
                  </div>
                  
                  {/* Cooldown indicator */}
                  {!isEligible && purchaseStatus && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <HiClock className="w-3 h-3" />
                      <span>
                        {pkg.id === 'daily' && purchaseStatus.dailyPurchasesToday >= 1 
                          ? 'Daily limit reached' 
                          : `${purchaseStatus.daysUntilNextPurchase} days remaining`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Display */}
        {status !== 'idle' && (
          <div className={`mb-4 p-4 rounded-xl text-center ${
            status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              <span>
                {status === 'success' && <HiCheckCircle className="w-5 h-5 text-green-600" />}
                {status === 'failed' && <HiXCircle className="w-5 h-5 text-red-600" />}
                {status === 'cancelled' && <HiStop className="w-5 h-5 text-gray-600" />}
                {(status === 'initiating' || status === 'confirming') && <HiClock className="w-5 h-5 text-blue-600 animate-spin" />}
              </span>
              <span className="font-medium">
                {status === 'initiating' && 'Initiating payment...'}
                {status === 'confirming' && 'Confirming purchase...'}
                {status === 'success' && 'Points purchased successfully!'}
                {status === 'cancelled' && 'Payment cancelled'}
                {status === 'failed' && error}
              </span>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <HiLockClosed className="w-4 h-4" />
              <span>Secure WLD payments</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <HiLightningBolt className="w-4 h-4" />
              <span>Instant point delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
