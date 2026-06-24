import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';
import { marketplaceApi } from '../../api/marketplace';
import { smartbuyApi } from '../../api/smartbuy';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { toast } from 'react-hot-toast';
import { User, ShoppingBag, List, Bookmark, History, Save, Edit3, ShieldAlert, MessageSquare } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import ChatDrawer from '../../components/ChatDrawer';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const tabQuery = searchParams.get('tab');
  
  // Tab State: 'info', 'purchases', 'listings', 'saved', 'token'
  const [activeTab, setActiveTab] = useState(tabQuery || 'info');

  // Sync state if search params tab query changes
  useEffect(() => {
    if (tabQuery) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tab Data
  const [profileData, setProfileData] = useState(null);
  const [myPurchases, setMyPurchases] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [tokenHistory, setTokenHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [chatParams, setChatParams] = useState(null);
  const [activeChatTab, setActiveChatTab] = useState('selling');

  // Edit fields
  const [mobile, setMobile] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  // Cancel Registration Modal States
  const [cancelRegModalOpen, setCancelRegModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [understandPenaltyChecked, setUnderstandPenaltyChecked] = useState(false);

  const fetchProfileInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await authApi.getProfile();
      setProfileData(info);
      setMobile(info.mobile || '');
    } catch (err) {
      console.error(err);
      setError('Could not fetch user profile details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const data = await authApi.getMyPurchases();
      const list = data.results || (Array.isArray(data) ? data : []);
      setMyPurchases(list);
    } catch (err) {
      console.error(err);
      setMyPurchases([]);
      toast.error('Failed to load purchases.');
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await authApi.getMyListings();
      const list = data.results || (Array.isArray(data) ? data : []);
      setMyListings(list);
    } catch (err) {
      console.error(err);
      setMyListings([]);
      toast.error('Failed to load marketplace listings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const data = await marketplaceApi.getSavedProducts();
      const list = data.results || (Array.isArray(data) ? data : []);
      setSavedProducts(list);
    } catch (err) {
      console.error(err);
      setSavedProducts([]);
      toast.error('Failed to load saved products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const data = await authApi.getTokenHistory();
      const list = data.results || (Array.isArray(data) ? data : []);
      setTokenHistory(list);
    } catch (err) {
      console.error(err);
      setTokenHistory([]);
      toast.error('Failed to load token history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await marketplaceApi.getConversations();
      const list = data.results || (Array.isArray(data) ? data : []);
      setConversations(list);
    } catch (err) {
      console.error(err);
      setConversations([]);
      toast.error('Failed to load chat conversations.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch depending on active tab
  useEffect(() => {
    if (activeTab === 'info') fetchProfileInfo();
    if (activeTab === 'purchases') fetchPurchases();
    if (activeTab === 'listings') fetchListings();
    if (activeTab === 'saved') fetchSaved();
    if (activeTab === 'token') fetchTokens();
    if (activeTab === 'chats') fetchConversations();
  }, [activeTab]);

  // Automatically open specific chat if query parameters match
  const listingIdQuery = searchParams.get('listingId');
  const otherUserIdQuery = searchParams.get('otherUserId');

  useEffect(() => {
    if (activeTab === 'chats' && conversations.length > 0 && listingIdQuery && otherUserIdQuery) {
      const match = conversations.find(
        (conv) =>
          String(conv.listing.id) === String(listingIdQuery) &&
          String(conv.other_user.employee_id) === String(otherUserIdQuery)
      );
      if (match) {
        setChatParams({
          listingId: match.listing.id,
          sellerId: match.other_user.employee_id,
          listingTitle: match.listing.title,
          sellerName: match.other_user.name,
          listingStatus: match.listing.status,
        });
      }
    }
  }, [activeTab, conversations, listingIdQuery, otherUserIdQuery]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('mobile', mobile);
      if (profilePic) {
        formData.append('profile_picture', profilePic);
      }

      await authApi.updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      fetchProfileInfo();
    } catch (err) {
      toast.error('Failed to update profile info.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistrationClick = (reg) => {
    setSelectedReg(reg);
    setUnderstandPenaltyChecked(false);
    setCancelRegModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedReg) return;
    setLoading(true);
    try {
      await smartbuyApi.cancelRegistration(selectedReg.campaign);
      toast.success('Registration cancelled successfully.');
      setCancelRegModalOpen(false);
      setSelectedReg(null);
      fetchPurchases();
      fetchTokens();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Vertical Tabs */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-4 h-fit space-y-2 shadow-sm">
          <button
            onClick={() => setActiveTab('info')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all text-left cursor-pointer ${
              activeTab === 'info' ? 'bg-[#003366] text-white' : 'text-gray-650 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" /> Personal Info
          </button>
          
          <button
            onClick={() => setActiveTab('purchases')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all text-left cursor-pointer ${
              activeTab === 'purchases' ? 'bg-[#003366] text-white' : 'text-gray-650 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> My Purchases
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all text-left cursor-pointer ${
              activeTab === 'listings' ? 'bg-[#003366] text-white' : 'text-gray-650 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" /> My Listings
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all text-left cursor-pointer ${
              activeTab === 'chats' ? 'bg-[#003366] text-white' : 'text-gray-650 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> My Chats
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all text-left cursor-pointer ${
              activeTab === 'saved' ? 'bg-[#003366] text-white' : 'text-gray-650 hover:bg-gray-50'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Saved Products
          </button>

          <button
            onClick={() => setActiveTab('token')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all text-left cursor-pointer ${
              activeTab === 'token' ? 'bg-[#003366] text-white' : 'text-gray-650 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4" /> Token History
          </button>
        </div>

        {/* Right Side: Tab Panel Content */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {loading && !profileData && (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}

          {activeTab === 'info' && profileData && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-extrabold text-[#003366]">Personal Profile</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-500 border border-blue-200 bg-blue-50/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex items-center gap-6">
                  {/* Profile Pic */}
                  <div className="w-24 h-24 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    {profileData.profile_picture ? (
                      <img src={profileData.profile_picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  {isEditing && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Change Profile Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProfilePic(e.target.files[0])}
                        className="text-xs text-gray-550 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 file:cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Employee ID</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-600 font-mono font-medium">
                      {profileData.employee_id}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-600 font-medium">
                      {profileData.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Official Email</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-600 font-medium">
                      {profileData.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Department</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-600 font-medium">
                      {profileData.department}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mobile Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                        placeholder="Enter 10-digit mobile number"
                        required
                      />
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 font-medium">
                        {profileData.mobile || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-4 border-t border-gray-100 pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setMobile(profileData.mobile || '');
                        setProfilePic(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-[#003366]">My SmartBuy Purchases</h2>
              {myPurchases.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-450 border border-dashed border-gray-200 rounded-xl">
                  You haven't reserved any items in SmartBuy campaigns yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-gray-400 uppercase text-xs">Campaign</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-400 uppercase text-xs">Reservation Date</th>
                        <th className="px-6 py-3 text-right font-bold text-gray-400 uppercase text-xs">Token Paid</th>
                        <th className="px-6 py-3 text-center font-bold text-gray-400 uppercase text-xs">Status</th>
                        <th className="px-6 py-3 text-center font-bold text-gray-400 uppercase text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium text-gray-700">
                      {myPurchases.map((reg) => (
                        <tr key={reg.id}>
                          <td className="px-6 py-4">{reg.campaign_title || reg.campaign?.title}</td>
                          <td className="px-6 py-4">{formatDate(reg.reservation_date, 'dd MMM yyyy')}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(reg.token_amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              reg.payment_status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : reg.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {reg.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {reg.payment_status !== 'cancelled' && reg.payment_status !== 'rejected' && (
                              <button
                                onClick={() => handleCancelRegistrationClick(reg)}
                                className="text-xs font-bold text-red-650 hover:text-red-500 border border-red-200 bg-red-50/50 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-[#003366]">My Marketplace Listings</h2>
              {myListings.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-450 border border-dashed border-gray-200 rounded-xl">
                  You haven't listed any products for sale yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myListings.map((item) => (
                    <Link
                      key={item.id}
                      to={`/marketplace/${item.id}`}
                      className="border border-gray-205 rounded-xl p-4 flex gap-4 bg-gray-55/20 hover:border-blue-500 hover:shadow-sm transition-all"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.images?.length > 0 && <img src={item.images[0].image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-950 truncate text-sm">{item.title}</h4>
                        <div className="text-[#003366] font-bold text-xs mt-0.5">{formatCurrency(item.price)}</div>
                        <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className={`px-2 py-0.5 rounded ${
                            item.status === 'approved' || item.status === 'available'
                              ? 'bg-green-100 text-green-850'
                              : item.status === 'pending'
                              ? 'bg-yellow-105 text-yellow-850'
                              : 'bg-red-100 text-red-850'
                          }`}>{item.status}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-[#003366]">Saved Products</h2>
              {savedProducts.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-450 border border-dashed border-gray-200 rounded-xl">
                  Your saved items list is empty.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedProducts.map((saved) => {
                    const listing = saved.marketplace_listing;
                    if (!listing) return null;
                    return (
                      <Link
                        key={saved.id}
                        to={`/marketplace/${listing.id}`}
                        className="border border-gray-200 rounded-xl p-4 flex gap-4 hover:border-blue-500 hover:shadow-sm transition-all"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {listing.images?.length > 0 && (
                            <img src={listing.images[0].image} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-950 truncate text-sm">{listing.title}</h4>
                          <div className="text-[#003366] font-bold text-xs mt-0.5">{formatCurrency(listing.price)}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'token' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-[#003366]">Token Payment History</h2>
              {tokenHistory.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-450 border border-dashed border-gray-200 rounded-xl">
                  No token transactions recorded.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-gray-400 uppercase text-xs">Payment Date</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-400 uppercase text-xs">Reference Registration ID</th>
                        <th className="px-6 py-3 text-right font-bold text-gray-400 uppercase text-xs">Amount</th>
                        <th className="px-6 py-3 text-center font-bold text-gray-400 uppercase text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium text-gray-700">
                      {tokenHistory.map((tok) => (
                        <tr key={tok.id}>
                          <td className="px-6 py-4">{formatDate(tok.submitted_at, 'dd MMM yyyy')}</td>
                          <td className="px-6 py-4">#Reg-{tok.registration}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(tok.amount)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              tok.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : tok.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tok.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-extrabold text-[#003366]">My Chat Messages</h2>
                <button
                  onClick={fetchConversations}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-500 border border-blue-200 bg-blue-50/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {/* Toggle switch between selling/buying */}
              <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-fit mb-6">
                <button
                  onClick={() => setActiveChatTab('selling')}
                  className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeChatTab === 'selling'
                      ? 'bg-[#003366] text-white shadow-sm'
                      : 'text-gray-650 hover:text-gray-900'
                  }`}
                >
                  Chats on My Ads (Selling)
                </button>
                <button
                  onClick={() => setActiveChatTab('buying')}
                  className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeChatTab === 'buying'
                      ? 'bg-[#003366] text-white shadow-sm'
                      : 'text-gray-650 hover:text-gray-900'
                  }`}
                >
                  My Buying Chats
                </button>
              </div>

              {activeChatTab === 'selling' ? (
                /* Selling Chats view - group conversations by listing */
                (() => {
                  const sellingGroups = {};
                  conversations.forEach((conv) => {
                    const isSeller = conv.listing.seller_id === user?.employee_id;
                    if (isSeller) {
                      const lid = conv.listing.id;
                      if (!sellingGroups[lid]) {
                        sellingGroups[lid] = {
                          listing: conv.listing,
                          chats: [],
                        };
                      }
                      sellingGroups[lid].chats.push(conv);
                    }
                  });
                  const sellingGroupsArray = Object.values(sellingGroups);

                  return (
                    <div className="space-y-6">
                      {sellingGroupsArray.length === 0 ? (
                        <div className="text-center py-12 text-sm text-gray-455 border border-dashed border-gray-200 rounded-xl bg-gray-50/10">
                          No active chats found on your listed ads.
                        </div>
                      ) : (
                        sellingGroupsArray.map((group) => (
                          <div key={group.listing.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                            {/* Listing header */}
                            <div className="bg-gray-50/50 p-4 border-b border-gray-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                  {group.listing.cover_image ? (
                                    <img src={group.listing.cover_image} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Photo</div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-gray-900 truncate text-sm">{group.listing.title}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[#003366] font-bold text-xs">{formatCurrency(group.listing.price)}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                      group.listing.status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                      {group.listing.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Buyers list */}
                            <div className="divide-y divide-gray-100">
                              {group.chats.map((conv) => (
                                <div key={conv.id} className="p-4 flex items-center justify-between hover:bg-gray-50/20 transition-colors">
                                  <div className="min-w-0 flex-1 mr-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900 text-sm">{conv.other_user.name}</span>
                                      <span className="text-[10px] text-gray-400 font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                        {conv.other_user.department}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1.5">
                                      <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{conv.last_message.message}</span>
                                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                                        • {formatRelativeTime(conv.last_message.timestamp)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {conv.unread_count > 0 && (
                                      <span className="bg-green-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                                        {conv.unread_count}
                                      </span>
                                    )}
                                    <button
                                      onClick={() =>
                                        setChatParams({
                                          listingId: group.listing.id,
                                          sellerId: conv.other_user.employee_id, // we are seller, other_user is buyer
                                          listingTitle: group.listing.title,
                                          sellerName: conv.other_user.name,
                                          listingStatus: group.listing.status,
                                        })
                                      }
                                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                    >
                                      Open Chat
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()
              ) : (
                /* Buying Chats view - flat list of listings messaged about */
                (() => {
                  const buyingChats = conversations.filter((conv) => conv.listing.seller_id !== user?.employee_id);

                  return (
                    <div className="space-y-3">
                      {buyingChats.length === 0 ? (
                        <div className="text-center py-12 text-sm text-gray-450 border border-dashed border-gray-200 rounded-xl bg-gray-50/10">
                          You haven't started any buying conversations yet.
                        </div>
                      ) : (
                        buyingChats.map((conv) => (
                          <div key={conv.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-all bg-white">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                              {conv.listing.cover_image ? (
                                <img src={conv.listing.cover_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Photo</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-gray-950 truncate text-sm">{conv.listing.title}</h4>
                                <span className="text-[10px] text-gray-400 font-medium">
                                  {formatRelativeTime(conv.last_message.timestamp)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-550 font-semibold mt-0.5">
                                Seller: <span className="text-gray-800">{conv.other_user.name}</span> ({conv.other_user.department})
                              </div>
                              <p className="text-xs text-gray-450 truncate mt-1">
                                {conv.last_message.sender_id === user?.employee_id ? 'You: ' : ''}
                                {conv.last_message.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {conv.unread_count > 0 && (
                                <span className="bg-green-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                                  {conv.unread_count}
                                </span>
                              )}
                              <button
                                onClick={() =>
                                  setChatParams({
                                    listingId: conv.listing.id,
                                    sellerId: conv.other_user.employee_id, // seller ID is other_user
                                    listingTitle: conv.listing.title,
                                    sellerName: conv.other_user.name,
                                    listingStatus: conv.listing.status,
                                  })
                                }
                                className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-55 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Chat
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}

        </div>
      </div>

      {/* Chat Drawer Side panel */}
      {chatParams && (
        <ChatDrawer
          isOpen={!!chatParams}
          onClose={() => {
            setChatParams(null);
            fetchConversations();
          }}
          listingId={chatParams.listingId}
          sellerId={chatParams.sellerId}
          listingTitle={chatParams.listingTitle}
          sellerName={chatParams.sellerName}
          listingStatus={chatParams.listingStatus}
        />
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelRegModalOpen && selectedReg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-[#003366]">Confirm Cancellation</h3>
              <button 
                onClick={() => {
                  setCancelRegModalOpen(false);
                  setSelectedReg(null);
                }} 
                className="text-gray-400 hover:text-gray-650 cursor-pointer text-xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-750">
                Are you sure you want to cancel your registration for <strong className="text-gray-900">{selectedReg.campaign_title || selectedReg.campaign?.title || `Campaign #${selectedReg.campaign}`}</strong>?
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
                <h4 className="font-bold text-amber-800 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" /> Backout Penalty Warning
                </h4>
                {selectedReg.is_waitlisted ? (
                  <p className="text-amber-700">
                    You are currently waitlisted. Cancelling will forfeit 0% of your deposit. You will receive a 100% refund of ₹{selectedReg.token_amount} if payment was already approved.
                  </p>
                ) : selectedReg.campaign_status === 'active' ? (
                  <p className="text-amber-700">
                    This campaign is currently <strong className="uppercase">Active</strong>. Cancelling your confirmed slot will refund <strong>₹{formatCurrency(selectedReg.campaign_cancellation_refund_amount)}</strong> of your token deposit. The remaining <strong>₹{formatCurrency(parseFloat(selectedReg.token_amount) - parseFloat(selectedReg.campaign_cancellation_refund_amount))}</strong> will be forfeited as a penalty.
                  </p>
                ) : (
                  <p className="text-amber-700">
                    This campaign is currently <strong className="uppercase">Closed</strong>. Cancelling after campaign closure will forfeit <strong>100%</strong> of your token deposit. Refund amount will be ₹0.00.
                  </p>
                )}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={understandPenaltyChecked}
                  onChange={(e) => setUnderstandPenaltyChecked(e.target.checked)}
                  className="mt-1 cursor-pointer"
                />
                <span className="text-xs text-gray-650 font-semibold select-none">
                  I understand that this action is irreversible and I agree to forfeit the appropriate penalty amount based on campaign guidelines.
                </span>
              </label>
            </div>

            <div className="flex gap-4 border-t border-gray-100 pt-4">
              <button
                onClick={handleConfirmCancel}
                disabled={!understandPenaltyChecked || loading}
                className={`flex-1 py-2.5 rounded-lg font-bold text-white transition-colors cursor-pointer text-sm text-center ${
                  understandPenaltyChecked && !loading
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCancelRegModalOpen(false);
                  setSelectedReg(null);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
