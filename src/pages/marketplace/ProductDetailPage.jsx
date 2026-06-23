import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceApi } from '../../api/marketplace';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import ChatDrawer from '../../components/ChatDrawer';
import { formatCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { toast } from 'react-hot-toast';
import { MessageSquare, Bookmark, ShieldAlert, Eye, Calendar, UserCheck } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Image gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Chat Drawer state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Memoize WebSocket URL for real-time status updates
  const wsUrl = useMemo(() => {
    if (!id) return null;
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const apiHost = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '')
      : 'localhost:8000';
    return `${wsScheme}://${apiHost}/ws/listings/${id}/?token=${encodeURIComponent(token)}`;
  }, [id]);

  // Handle real-time listing status updates
  const handleListingUpdate = useCallback((message) => {
    if (message.type === 'listing_update') {
      if (message.status === 'deleted') {
        toast.error('This listing has been removed by the administrator.', { duration: 5000 });
        navigate('/marketplace');
        return;
      }
      setItem((prev) => {
        if (!prev) return prev;
        if (message.status === 'sold' && prev.status !== 'sold') {
          toast.error('This listing has just been marked as sold.', { duration: 5000 });
        } else if (message.status === 'available' && prev.status !== 'available') {
          toast.success('This listing is now active and available.', { duration: 5000 });
        }
        return { ...prev, status: message.status };
      });
    }
  }, [navigate]);

  useWebSocket(wsUrl, handleListingUpdate);

  // Fetch listing detail on mount
  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceApi.getListingDetail(id);
      setItem(data);
    } catch (err) {
      console.error('Error fetching listing details:', err);
      setError('Could not fetch product details. The listing may have been sold or removed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Save/wishlist listing toggle
  const handleSave = async () => {
    if (!item) return;
    const wasSaved = item.is_saved;
    try {
      if (wasSaved) {
        await marketplaceApi.unsaveProduct(id);
        toast.success('Listing removed from saved items');
      } else {
        await marketplaceApi.saveProduct(id);
        toast.success('Listing added to saved items');
      }
      // Update local state
      setItem((prev) => ({ ...prev, is_saved: !wasSaved }));
    } catch (err) {
      toast.error(wasSaved ? 'Could not remove listing' : 'Could not save listing');
    }
  };

  // Mark as sold (owner only)
  const handleMarkSold = async () => {
    try {
      await marketplaceApi.updateListingStatus(id, 'sold');
      toast.success('Listing marked as sold!');
      fetchDetail();
    } catch (err) {
      toast.error('Failed to update listing status.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;
  if (!item) return null;

  const isOwner = user?.employee_id === item.seller;
  const isSold = item.status === 'sold';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button onClick={() => navigate('/marketplace')} className="text-sm font-semibold text-blue-600 hover:text-blue-500 mb-6 cursor-pointer">
        &larr; Back to marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 lg:p-8">
        
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="h-96 bg-gray-50 border border-gray-150 rounded-xl overflow-hidden relative">
            {item.images?.length > 0 ? (
              <img
                src={item.images[activeImageIndex]?.image}
                alt={item.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Photos Uploaded
              </div>
            )}
            
            {isSold && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                <span className="bg-red-650 text-white font-black text-2xl tracking-widest px-6 py-2.5 rounded-lg border-2 border-white shadow-lg uppercase">
                  SOLD
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {item.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-2">
              {item.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 bg-gray-50 rounded-lg border overflow-hidden flex-shrink-0 cursor-pointer ${
                    activeImageIndex === idx ? 'border-blue-600 border-2' : 'border-gray-200'
                  }`}
                >
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase">
              {item.category?.name || 'Uncategorized'}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
              <Eye className="w-4 h-4" />
              <span>{item.views || 0} Views</span>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-950 mb-2">{item.title}</h1>
          
          <div className="text-2xl font-black text-[#003366] mb-4">
            {formatCurrency(item.price)}
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-3 mb-6 text-sm">
            <div>
              <span className="block text-xs text-gray-400 font-bold uppercase">Condition</span>
              <span className="font-semibold text-gray-800 uppercase">{item.condition.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="block text-xs text-gray-400 font-bold uppercase">Status</span>
              <span className="font-semibold text-gray-850 uppercase">{item.status}</span>
            </div>
          </div>

          <div className="mb-6 flex-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{item.description}</p>
          </div>

          {/* Vehicle or Property extra attributes if present */}
          {item.vehicle_details && (
            <div className="mb-6 bg-gray-55/50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-3">Vehicle Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div><span className="text-gray-400 block">Brand</span><strong className="text-gray-800">{item.vehicle_details.brand}</strong></div>
                <div><span className="text-gray-400 block">Model</span><strong className="text-gray-800">{item.vehicle_details.model}</strong></div>
                <div><span className="text-gray-400 block">Year</span><strong className="text-gray-800">{item.vehicle_details.year}</strong></div>
                <div><span className="text-gray-400 block">KM Driven</span><strong className="text-gray-800">{item.vehicle_details.km_driven}</strong></div>
                <div><span className="text-gray-400 block">Fuel Type</span><strong className="text-gray-800 capitalize">{item.vehicle_details.fuel_type}</strong></div>
                <div><span className="text-gray-400 block">Transmission</span><strong className="text-gray-800 capitalize">{item.vehicle_details.transmission}</strong></div>
              </div>
            </div>
          )}

          {item.property_details && (
            <div className="mb-6 bg-gray-55/50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-3">Property Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div><span className="text-gray-400 block">Type</span><strong className="text-gray-800 capitalize">{item.property_details.property_type}</strong></div>
                <div><span className="text-gray-400 block">For</span><strong className="text-gray-800 capitalize">{item.property_details.listing_type}</strong></div>
                <div><span className="text-gray-400 block">Area</span><strong className="text-gray-800">{item.property_details.area_sqft} sqft</strong></div>
                <div><span className="text-gray-400 block">Bedrooms</span><strong className="text-gray-800">{item.property_details.bedrooms} BHK</strong></div>
                <div><span className="text-gray-400 block">Bathrooms</span><strong className="text-gray-800">{item.property_details.bathrooms} Baths</strong></div>
                <div><span className="text-gray-400 block">Location</span><strong className="text-gray-800 truncate block">{item.property_details.location}</strong></div>
              </div>
            </div>
          )}

          {/* Seller Profile Summary */}
          <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-[#003366] uppercase">
                {item.seller_name?.slice(0, 2) || 'SE'}
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Listed By</span>
                <span className="font-semibold text-gray-850 text-sm block">{item.seller_name}</span>
                <span className="text-xs text-gray-500">{item.seller_department} Department</span>
              </div>
            </div>
            {isOwner && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Your Listing
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {isOwner ? (
              !isSold && (
                <button
                  onClick={handleMarkSold}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                >
                  Mark as Sold
                </button>
              )
            ) : (
              <>
                <button
                  onClick={() => setIsChatOpen(true)}
                  disabled={isSold}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                  Chat with Seller
                </button>

                <button
                  onClick={handleSave}
                  className={`p-3 border rounded-xl shadow-sm transition-colors cursor-pointer ${
                    item.is_saved
                      ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-650'
                  }`}
                  title={item.is_saved ? 'Remove from saved items' : 'Save Item'}
                >
                  <Bookmark className={`w-5 h-5 ${item.is_saved ? 'fill-current' : ''}`} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat Drawer Side panel */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        listingId={item.id}
        sellerId={item.seller}
        listingTitle={item.title}
        sellerName={item.seller_name}
        listingStatus={item.status}
      />
    </div>
  );
};

export default ProductDetailPage;
