import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { smartbuyApi } from '../../api/smartbuy';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CashfreeReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');

  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [campaignId, setCampaignId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError("No transaction details found in redirect URL.");
      setVerifying(false);
      return;
    }

    const runVerification = async () => {
      try {
        const response = await smartbuyApi.verifyPayment(orderId);
        setPaymentStatus(response.status);
        setCampaignId(response.campaign_id);
        
        if (response.status === 'PAID') {
          toast.success("Payment confirmed! Your campaign slot is booked.");
        } else {
          toast.error(`Transaction status: ${response.status}`);
        }
      } catch (err) {
        console.error("Verification failed:", err);
        setError(err.response?.data?.detail || "An error occurred while confirming payment status with Cashfree.");
        // Try to salvage campaign ID if it is nested in the error payload
        if (err.response?.data?.campaign_id) {
          setCampaignId(err.response.data.campaign_id);
        }
      } finally {
        setVerifying(false);
      }
    };

    runVerification();
  }, [orderId]);

  if (verifying) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-center space-y-6">
        <LoadingSpinner />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#003366]">Confirming Transaction</h2>
          <p className="text-xs text-gray-500">Contacting Cashfree gateway to verify deposit authorization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Verification Error</h2>
          <p className="text-xs text-gray-550">{error}</p>
        </div>
        <button
          onClick={() => navigate(campaignId ? `/smartbuy/${campaignId}` : '/smartbuy')}
          className="w-full py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
        >
          Return to Campaign <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const isSuccess = paymentStatus === 'PAID';

  return (
    <div className="max-w-md mx-auto my-16 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-center space-y-6 animate-fade-in">
      {isSuccess ? (
        <>
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-950">Payment Successful!</h2>
            <p className="text-xs text-gray-500">
              Your 10% token deposit has been authorized by the gateway. Your reservation is now fully secured.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-950">Payment Not Completed</h2>
            <p className="text-xs text-gray-500">
              The transaction is currently in status: <strong className="text-amber-700">{paymentStatus}</strong>. If money was debited, it will be auto-reclaimed within 24 hours.
            </p>
          </div>
        </>
      )}

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left text-xs font-semibold text-gray-650 space-y-2">
        <div className="flex justify-between">
          <span>Order ID:</span>
          <span className="font-mono text-gray-800">{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={isSuccess ? "text-green-700 font-bold" : "text-amber-700 font-bold"}>{paymentStatus}</span>
        </div>
      </div>

      <button
        onClick={() => navigate(campaignId ? `/smartbuy/${campaignId}` : '/smartbuy')}
        className="w-full py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
      >
        {isSuccess ? 'Return to Campaign' : 'Try Reservation Again'} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CashfreeReturnPage;
