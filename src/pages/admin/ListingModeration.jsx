import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { toast } from 'react-hot-toast';
import { 
  Check, X, Eye, AlertCircle, RefreshCw, Car, Home, ArrowRight, User 
} from 'lucide-react';

const ListingModeration = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  
  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actioning, setActioning] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getPendingListings();
      const list = data.results || (Array.isArray(data) ? data : []);
      setListings(list);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve pending listings queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this listing? It will become active and visible in the marketplace.')) return;
    setActioning(true);
    try {
      await adminApi.approveListing(id);
      toast.success('Listing approved successfully');
      setSelectedListing(null);
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve listing.');
    } finally {
      setActioning(false);
    }
  };

  const handleOpenReject = (id) => {
    setRejectId(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    setActioning(true);
    try {
      await adminApi.rejectListing(rejectId, rejectionReason);
      toast.success('Listing rejected successfully');
      setShowRejectModal(false);
      setSelectedListing(null);
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject listing.');
    } finally {
      setActioning(false);
    }
  };

  if (loading && listings.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchPending} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Listing Moderation</h1>
          <p className="mt-2 text-sm text-gray-650">Verify, approve, or reject employee-submitted marketplace ads.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={fetchPending}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 font-medium cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Pending Queue List */}
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
            <span>Pending Listings Queue</span>
            <span className="bg-[#003366]/10 text-[#003366] text-xs font-black px-2 py-0.5 rounded-full">
              {listings.length}
            </span>
          </h3>

          {listings.length === 0 ? (
            <EmptyState 
              title="All caught up!"
              message="There are no pending marketplace listings currently awaiting moderation."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {listings.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedListing(item)}
                  className={`border rounded-xl p-4 bg-white hover:shadow transition-all cursor-pointer flex gap-4 ${
                    selectedListing?.id === item.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'
                  }`}
                >
                  <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-150">
                    {item.images?.length > 0 ? (
                      <img src={item.images[0].image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase">No pic</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-gray-950 truncate text-sm">{item.title}</h4>
                        <span className="text-[#003366] font-extrabold text-sm flex-shrink-0">{formatCurrency(item.price)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5" />
                        <span>Seller: {item.seller_name} ({item.seller_department})</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                        Submitted: {formatDate(item.created_at, 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedListing(item);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-500 px-2 py-1 rounded"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Detail Panel & Actions */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-6">
            {selectedListing ? (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{selectedListing.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold text-gray-550 bg-gray-100 px-2 py-0.5 rounded uppercase">
                      Category: {selectedListing.category?.name}
                    </span>
                    <span className="text-xs font-bold text-[#003366] bg-blue-50 px-2 py-0.5 rounded uppercase">
                      Condition: {selectedListing.condition}
                    </span>
                  </div>
                </div>

                {/* Listing Images Gallery */}
                {selectedListing.images?.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {selectedListing.images.map((img) => (
                      <a 
                        key={img.id} 
                        href={img.image} 
                        target="_blank" 
                        rel="noreferrer"
                        className="h-12 bg-gray-50 border border-gray-200 rounded overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={img.image} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-sm text-gray-750 font-medium whitespace-pre-wrap max-h-36 overflow-y-auto pr-1">
                    {selectedListing.description}
                  </p>
                </div>

                {/* Vehicle Specs */}
                {selectedListing.vehicle_details && (
                  <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-[#003366] uppercase tracking-wider flex items-center gap-1.5">
                      <Car className="w-4 h-4" /> Vehicle Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-650">
                      <div>Brand: <span className="text-gray-900">{selectedListing.vehicle_details.brand}</span></div>
                      <div>Model: <span className="text-gray-900">{selectedListing.vehicle_details.model}</span></div>
                      <div>Year: <span className="text-gray-900">{selectedListing.vehicle_details.year}</span></div>
                      <div>KM: <span className="text-gray-900">{selectedListing.vehicle_details.km_driven?.toLocaleString()}</span></div>
                      <div>Fuel: <span className="text-gray-900 uppercase">{selectedListing.vehicle_details.fuel_type}</span></div>
                      <div>Trans: <span className="text-gray-900 capitalize">{selectedListing.vehicle_details.transmission}</span></div>
                    </div>
                  </div>
                )}

                {/* Property Specs */}
                {selectedListing.property_details && (
                  <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-[#003366] uppercase tracking-wider flex items-center gap-1.5">
                      <Home className="w-4 h-4" /> Property Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-650">
                      <div className="col-span-2">Loc: <span className="text-gray-900">{selectedListing.property_details.location}</span></div>
                      <div>Area: <span className="text-gray-900">{selectedListing.property_details.area_sqft} sqft</span></div>
                      <div>Beds: <span className="text-gray-900">{selectedListing.property_details.bedrooms} BHK</span></div>
                      <div>Baths: <span className="text-gray-900">{selectedListing.property_details.bathrooms}</span></div>
                      <div className="col-span-2 capitalize">Type: <span className="text-gray-900">{selectedListing.property_details.property_type} ({selectedListing.property_details.listing_type})</span></div>
                    </div>
                  </div>
                )}

                {/* Moderator Actions */}
                <div className="flex gap-4 border-t border-gray-100 pt-6">
                  <button
                    onClick={() => handleApprove(selectedListing.id)}
                    disabled={actioning}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleOpenReject(selectedListing.id)}
                    disabled={actioning}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold">No listing selected</p>
                <p className="text-xs max-w-[200px] mx-auto text-gray-400">Click on any pending item from the list to review details and take action.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* REJECTION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150">
            <h3 className="text-lg font-bold text-[#003366] border-b border-gray-150 pb-3 mb-4">Reject Listing</h3>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Provide Rejection Reason (Required)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Inappropriate description, invalid vehicle license details, poor quality screenshots..."
                  rows="4"
                  className="block w-full rounded-lg border-gray-300 py-2 px-3 border shadow-sm text-sm"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">The seller will be notified of this reason and the listing status will become 'rejected'.</p>
              
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actioning}
                  className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg text-sm font-bold cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingModeration;
