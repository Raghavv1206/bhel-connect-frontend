import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { smartbuyApi } from '../api/smartbuy';
import { marketplaceApi } from '../api/marketplace';
import { authApi } from '../api/auth';
import { 
  ShoppingCart, 
  ShoppingBag, 
  PlusCircle, 
  Users, 
  Bookmark, 
  Sparkles,
  AlertTriangle 
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Management
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [latestListings, setLatestListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    activeListings: 0,
    totalMembers: 450, // Static estimate for membership
    myReservations: 0,
  });

  // Calculate remaining days until end_date
  const getRemainingDaysText = (endDateStr) => {
    if (!endDateStr) return 'Active';
    const diffTime = new Date(endDateStr) - new Date();
    if (diffTime <= 0) return 'Expired';
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return '1 Day Left';
    return `${diffDays} Days Left`;
  };

  // Main data fetching method
  const fetchDashboardData = async () => {
    try {
      // 1. Fetch active smartbuy campaigns
      const campaignsData = await smartbuyApi.getCampaigns({ status: 'active' });
      const campaigns = campaignsData.results || (Array.isArray(campaignsData) ? campaignsData : []);
      setActiveCampaigns(campaigns);

      // 2. Fetch latest 3 approved available listings
      const listingsData = await marketplaceApi.getListings({
        ordering: '-created_at',
        status: 'available',
        limit: 3
      });
      // Handle potential pagination payload structure
      const listings = listingsData.results || (Array.isArray(listingsData) ? listingsData : []);
      setLatestListings(listings);

      // 3. Fetch user purchases
      let purchaseCount = 0;
      try {
        const purchasesData = await authApi.getMyPurchases();
        const purchasesList = purchasesData.results || (Array.isArray(purchasesData) ? purchasesData : []);
        purchaseCount = purchasesList.length;

      } catch (e) {
        console.error('Failed to fetch user purchases:', e);
      }

      // 4. Fetch total active listings count
      let activeListingsCount = 0;
      try {
        const activeListingsQuery = await marketplaceApi.getListings({
          status: 'available',
          limit: 1
        });
        activeListingsCount = activeListingsQuery.count !== undefined 
          ? activeListingsQuery.count 
          : (activeListingsQuery.results ? activeListingsQuery.results.length : 0);
      } catch (e) {
        console.error('Failed to fetch active listings count:', e);
      }

      // 5. Fetch total registered members count
      let membersCount = 0;
      try {
        const membersCountData = await authApi.getEmployeeCount();
        membersCount = membersCountData.count || 0;
      } catch (e) {
        console.error('Failed to fetch registered members count:', e);
        membersCount = 450; // Fallback in case of error
      }

      // Update Dashboard Stats
      setStats({
        activeCampaigns: campaigns.length,
        activeListings: activeListingsCount,
        totalMembers: membersCount,
        myReservations: purchaseCount,
      });

    } catch (err) {
      console.error('Failed to fetch homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and set up intervals
  useEffect(() => {
    fetchDashboardData();

    // Refresh campaigns and stats every 60 seconds
    const fastInterval = setInterval(() => {
      fetchDashboardData();
    }, 60000);

    return () => {
      clearInterval(fastInterval);
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-gray-50 select-none">
      {/* CSS Animation Injector for seamless scrolling marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee-scroll {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* SECTION 2: CONDITIONAL RENDER — New in Marketplace headline banner */}
      {latestListings.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 py-3 px-6 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-[#003366]">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
            <Sparkles className="w-3.5 h-3.5" />
            New Arrivals
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {latestListings.map((item) => (
              <Link
                key={item.id}
                to={`/marketplace/${item.id}`}
                className="bg-white border border-blue-200/60 shadow-sm rounded-full px-3 py-1 text-xs font-bold text-gray-700 hover:text-blue-700 hover:border-blue-300 hover:shadow transition-all duration-200 flex items-center gap-1.5"
              >
                <span>🆕 {item.title}</span>
                <span className="text-blue-800 font-extrabold">{formatCurrency(item.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1: Thin Scrolling Marquee Ticker */}
      <div className="w-full bg-[#002244] text-white py-3 text-xs overflow-hidden border-b border-blue-950 shadow-sm relative">
        <div className="w-full overflow-hidden">
          <div className="animate-marquee-scroll font-bold tracking-wider uppercase">
            {activeCampaigns.length > 0 ? (
              // Display the recent 3 campaigns, duplicated once for a seamless infinite scroll loop
              [...activeCampaigns.slice(0, 3), ...activeCampaigns.slice(0, 3)].map((c, idx) => (
                <span key={`${c.id}-${idx}`} className="mx-8 flex items-center gap-2 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>SmartBuy: {c.title}</span>
                  <span className="text-gray-400 font-medium">({c.confirmed_buyers_count || 0}/{c.total_quantity} Reserved)</span>
                  <span className="text-yellow-400 font-extrabold">{formatCurrency(c.current_price || c.price)}</span>
                  <span className="bg-blue-600 px-1.5 py-0.5 rounded text-[10px] lowercase font-semibold text-blue-50">
                    {getRemainingDaysText(c.end_date)}
                  </span>
                  <span className="text-blue-900 ml-4 font-normal">|</span>
                </span>
              ))
            ) : (
              <span className="mx-8 flex items-center gap-2 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Welcome to BHEL Connect! Active SmartBuy campaigns will show up here.</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Viewport Area */}
      <div className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* SECTION 3: Welcome Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003366] tracking-tight">
            Welcome back, {user?.name || 'BHEL Employee'}
          </h1>
          <p className="mt-1 text-base text-gray-550 font-semibold max-w-2xl mx-auto">
            Your internal portal for SmartBuy group buying campaigns and peer-to-peer marketplace trading.
          </p>
        </div>

        {/* SECTION 4: Three Large Action Cards in a Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto w-full">
          <button
            onClick={() => navigate('/smartbuy')}
            className="flex flex-col items-center justify-center p-6 bg-white hover:bg-blue-50/45 border border-gray-200 hover:border-blue-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-250 group text-center cursor-pointer"
          >
            <div className="p-4 rounded-xl bg-blue-50 text-[#003366] mb-4 group-hover:scale-105 transition-transform duration-200">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Browse SmartBuy</h3>
            <p className="text-xs text-gray-500 max-w-xs font-medium">
              Join active group purchase campaigns to secure wholesale volume discounts on electronic appliances and IT equipment.
            </p>
          </button>

          <button
            onClick={() => navigate('/marketplace')}
            className="flex flex-col items-center justify-center p-6 bg-white hover:bg-blue-50/45 border border-gray-200 hover:border-blue-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-250 group text-center cursor-pointer"
          >
            <div className="p-4 rounded-xl bg-green-50 text-green-700 mb-4 group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Browse Marketplace</h3>
            <p className="text-xs text-gray-500 max-w-xs font-medium">
              Buy pre-owned items directly from fellow BHEL colleagues with secure, in-network authentication.
            </p>
          </button>

          <button
            onClick={() => navigate('/marketplace/sell')}
            className="flex flex-col items-center justify-center p-6 bg-white hover:bg-blue-50/45 border border-gray-200 hover:border-blue-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-250 group text-center cursor-pointer"
          >
            <div className="p-4 rounded-xl bg-purple-50 text-purple-700 mb-4 group-hover:scale-105 transition-transform duration-200">
              <PlusCircle className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Sell a Product</h3>
            <p className="text-xs text-gray-500 max-w-xs font-medium">
              Create a listing for your unused appliances, furniture, or household items and trade easily with coworkers.
            </p>
          </button>
        </div>

        {/* SECTION 5: Four Stat Boxes in a Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm text-center">
            <div className="flex justify-center text-blue-600 mb-1.5">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.activeCampaigns}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">Active Campaigns</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm text-center">
            <div className="flex justify-center text-green-600 mb-1.5">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.activeListings}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">Active Listings</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm text-center">
            <div className="flex justify-center text-purple-600 mb-1.5">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.totalMembers}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">Total Members</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm text-center">
            <div className="flex justify-center text-yellow-600 mb-1.5">
              <Bookmark className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.myReservations}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">My Reservations</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
