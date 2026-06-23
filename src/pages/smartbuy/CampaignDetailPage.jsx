import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { smartbuyApi } from '../../api/smartbuy';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-hot-toast';
import { Clock } from 'lucide-react';

// Initialize Cashfree once
const cashfreeMode = import.meta.env.VITE_CASHFREE_ENV || 'sandbox';
let cashfreeInstance = null;
const getCashfree = () => {
  if (!cashfreeInstance && typeof window !== 'undefined' && window.Cashfree) {
    cashfreeInstance = window.Cashfree({ mode: cashfreeMode });
  }
  return cashfreeInstance;
};

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  // Register state
  const [registering, setRegistering] = useState(false);

  // Fetch campaign detail
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await smartbuyApi.getCampaignDetail(id);
      setCampaign(data);
    } catch (err) {
      console.error('Error fetching campaign detail:', err);
      setError('Could not fetch campaign details. It may have been removed or closed.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail();
  }, [fetchDetail]);

  // Live countdown timer setup
  useEffect(() => {
    if (!campaign?.end_date) return;

    const interval = setInterval(() => {
      const endTime = new Date(campaign.end_date).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 65)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [campaign?.end_date]);

  // Handle reserve action (confirms reservation and locks item using Cashfree Drop-in Checkout)
  const handleReserve = async () => {
    setRegistering(true);
    try {
      // 1. Create a payment order on backend
      const orderData = await smartbuyApi.createOrder(id);
      const { payment_session_id, order_id } = orderData;

      if (!payment_session_id) {
        toast.error("Failed to generate checkout payment session.");
        setRegistering(false);
        return;
      }

      const cfInstance = getCashfree();
      if (!cfInstance) {
        toast.error("Cashfree SDK not initialized. Please check network/script imports.");
        setRegistering(false);
        return;
      }

      // 2. Open Cashfree Drop-in UI modal
      const result = await cfInstance.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_modal",
      });

      // 3. Handle checkout promise resolution
      if (result.error) {
        // Closed by user or network error
        toast.error(result.error.message || "Payment modal closed without completion.");
        fetchDetail();
        return;
      }

      if (result.redirect) {
        // Redirection flow initiated (e.g. for fallback authentication)
        return;
      }

      if (result.paymentDetails) {
        // User submitted payment attempt, verify payment status on backend immediately
        const verifyToastId = toast.loading("Verifying transaction authorization...");
        try {
          const verifyData = await smartbuyApi.verifyPayment(order_id);
          if (verifyData.status === "PAID") {
            toast.success("Payment confirmed! Your campaign slot is booked.", { id: verifyToastId });
          } else {
            toast.error(`Transaction status: ${verifyData.status}`, { id: verifyToastId });
          }
        } catch (verErr) {
          console.error("Verification error:", verErr);
          toast.error("Error verifying payment status. Please check your Profile tab.", { id: verifyToastId });
        }
        fetchDetail();
      }

    } catch (err) {
      console.error('Checkout failed:', err);
      toast.error(err.response?.data?.detail || 'Failed to initiate reservation checkout.');
    } finally {
      setRegistering(false);
    }
  };

  // Handle join waitlist action
  const handleJoinWaitlist = async () => {
    setRegistering(true);
    try {
      await smartbuyApi.joinWaitlist(id);
      toast.success('Successfully joined the waitlist!');
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to join waitlist.');
    } finally {
      setRegistering(false);
    }
  };



  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;
  if (!campaign) return null;

  const isSoldOut = campaign.available_quantity === 0;
  const progressPercent = Math.min(
    ((campaign.total_quantity - campaign.available_quantity) / campaign.total_quantity) * 100,
    100
  );

  const getLowestPrice = () => {
    if (!campaign?.pricing_tiers || campaign.pricing_tiers.length === 0) return 0;
    const prices = campaign.pricing_tiers.map(t => parseFloat(t.price));
    return Math.min(...prices);
  };
  const tokenDeposit = getLowestPrice() * 0.1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button onClick={() => navigate('/smartbuy')} className="text-sm font-semibold text-blue-600 hover:text-blue-500 mb-6 cursor-pointer">
        &larr; Back to campaigns list
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 lg:p-8">
        
        {/* Left: Images and Countdown */}
        <div className="space-y-6">
          <div className="h-96 bg-gray-50 border border-gray-150 rounded-xl overflow-hidden relative">
            {campaign.product_image ? (
              <img
                src={campaign.product_image}
                alt={campaign.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}

            {isExpired && (
              <span className="absolute top-4 left-4 bg-red-650 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                CLOSED
              </span>
            )}
          </div>

          {/* Countdown Clock */}
          {!isExpired && (
            <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4 flex items-center justify-around text-center">
              <div className="flex items-center gap-2 text-[#003366]">
                <Clock className="w-6 h-6 animate-pulse" />
                <span className="font-semibold text-sm">Time Left:</span>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="block text-2xl font-black text-gray-900">{timeLeft.days}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-450">Days</span>
                </div>
                <div className="text-2xl font-light text-gray-300">:</div>
                <div>
                  <span className="block text-2xl font-black text-gray-900">{timeLeft.hours}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-450">Hrs</span>
                </div>
                <div className="text-2xl font-light text-gray-300">:</div>
                <div>
                  <span className="block text-2xl font-black text-gray-900">{timeLeft.minutes}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-450">Mins</span>
                </div>
                <div className="text-2xl font-light text-gray-300">:</div>
                <div>
                  <span className="block text-2xl font-black text-gray-900">{timeLeft.seconds}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-450">Secs</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Info, Price, Actions */}
        <div className="flex flex-col">
          <div className="mb-4">
            <span className="bg-blue-100 text-[#003366] text-xs font-bold px-3 py-1 rounded-full uppercase">
              Campaign ID: #{campaign.id}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-950 mb-2">{campaign.title}</h1>
          <p className="text-sm text-gray-600 mb-6">{campaign.description}</p>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pricing Tiers</h3>
            <div className="border border-gray-150 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-150">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase">Milestone</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-400 uppercase">Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-sm">
                  {campaign.pricing_tiers?.map((tier, idx) => {
                    const isCurrent =
                      campaign.confirmed_buyers_count >= tier.min_buyers &&
                      (tier.max_buyers === null || campaign.confirmed_buyers_count <= tier.max_buyers);
                    
                    return (
                      <tr key={tier.id || idx} className={isCurrent ? 'bg-green-50/50 font-semibold' : ''}>
                        <td className="px-4 py-3">
                          {tier.min_buyers}{tier.max_buyers ? ` - ${tier.max_buyers}` : '+'} Buyers
                          {isCurrent && (
                            <span className="ml-2 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                              Current Active
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-right ${isCurrent ? 'text-green-700' : 'text-gray-700'}`}>
                          {formatCurrency(tier.price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Booking Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
              <span>Booking Progress: {campaign.total_quantity - campaign.available_quantity} / {campaign.total_quantity} Slots Confirmed</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Current Price prominent display */}
          <div className="bg-[#003366]/5 border border-[#003366]/10 rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Current Price per unit</span>
              <span className="text-3xl font-black text-[#003366]">{formatCurrency(campaign.current_price)}</span>
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Token Deposit (10%)</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(tokenDeposit)}</span>
            </div>
          </div>

          {/* Action Button */}
          {!isExpired ? (
            campaign.user_registration ? (
              campaign.user_registration.is_waitlisted ? (
                <button
                  disabled
                  className="w-full py-3 px-6 rounded-xl font-bold text-white bg-amber-500/80 transition-colors shadow-sm cursor-not-allowed"
                >
                  Waitlisted (Position #{campaign.user_registration.waitlist_position})
                </button>
              ) : campaign.user_registration.payment_status === 'approved' ? (
                <button
                  disabled
                  className="w-full py-3 px-6 rounded-xl font-bold text-white bg-green-600 shadow-sm cursor-not-allowed"
                >
                  ✓ Reserved
                </button>
              ) : (
                <button
                  onClick={handleReserve}
                  disabled={registering}
                  className="w-full py-3 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  {registering ? 'Reserving slot...' : 'Pay Now to Confirm Reservation'}
                </button>
              )
            ) : isSoldOut ? (
              <button
                onClick={handleJoinWaitlist}
                disabled={registering}
                className="w-full py-3 px-6 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm cursor-pointer"
              >
                {registering ? 'Joining waitlist...' : 'Inventory Full — Join Waitlist'}
              </button>
            ) : (
              <button
                onClick={handleReserve}
                disabled={registering}
                className="w-full py-3 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                {registering ? 'Reserving slot...' : 'Reserve Now'}
              </button>
            )
          ) : (
            <div className="w-full text-center py-3 bg-gray-100 rounded-xl text-gray-500 font-bold">
              Campaign Closed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPage;
