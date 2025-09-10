"use client";
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from "@worldcoin/minikit-js";
import { useState } from "react";
import { getPaymentAddress } from "../../lib/payment-config";

const sendPayment = async () => {
  try {
  const res = await fetch(`/api/initiate-payment`, {
      method: "POST",
    });

    const { id } = await res.json();

    console.log(id);

    const payload: PayCommandInput = {
      reference: id,
      to: getPaymentAddress(), // Use configurable payment address
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(0.5, Tokens.WLD).toString(),
        },
        {
          symbol: Tokens.USDCE,
          token_amount: tokenToDecimals(0.1, Tokens.USDCE).toString(),
        },
      ],
      description: "Watch this is a test",
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

const handlePay = async (
  setStatus: (s:string)=>void,
  setError: (e:string|null)=>void
) => {
  if (!MiniKit.isInstalled()) {
    console.error("MiniKit is not installed");
    return;
  }
  setStatus("initiating");
  const sendPaymentResponse = await sendPayment();
  const response = sendPaymentResponse?.finalPayload;
  if (!response) {
    setStatus("cancelled");
    return;
  }

  if (response.status == "success") {
    // Use relative path so we don't rely on client env vars (which are undefined without NEXT_PUBLIC_ prefix)
    const res = await fetch(`/api/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: response }),
    });
    const payment = await res.json();
    if (payment.success) {
      setStatus("success");
      setError(null);
    } else {
      setStatus("failed");
      setError("Payment verification failed");
    }
  } else if(response.status === 'error') {
    setStatus("failed");
    setError("MiniKit returned error status");
  }
};

export const PayBlock = () => {
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string|null>(null);
  return (
    <div className="flex flex-col gap-3">
      <button
        className="bg-blue-500 p-4 disabled:opacity-50"
        disabled={status === 'initiating'}
        onClick={()=>handlePay(setStatus,setError)}
      >
        {status === 'initiating' ? 'Processing...' : 'Pay'}
      </button>
      {status !== 'idle' && <div className="text-sm">Status: {status}</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {status==='success' && !error && <div className="text-green-600 text-sm">Payment successful</div>}
    </div>
  );
};
