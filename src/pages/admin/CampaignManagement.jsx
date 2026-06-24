import React, { useState, useEffect } from 'react';
import { smartbuyApi } from '../../api/smartbuy';
import { adminApi } from '../../api/admin';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { toast } from 'react-hot-toast';
import { 
  Plus, Calendar, Clock, Edit2, Archive, XCircle, Copy, ArrowRight, Save, 
  Trash2, Eye, RefreshCw 
} from 'lucide-react';

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Extend campaign state
  const [extendDays, setExtendDays] = useState(7);

  // Clone campaign state
  const [cloneStartDate, setCloneStartDate] = useState('');
  const [cloneDuration, setCloneDuration] = useState(14);

  // Multi-step create campaign state
  const [createStep, setCreateStep] = useState(1);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    vendor: '',
    product_image: '',
    upi_qr_image: '',
    total_quantity: 50,
    duration_days: 14,
    start_date: '',
    token_deposit: '',
    cancellation_refund_amount: '',
    pricing_tiers: [
      { min_buyers: 1, max_buyers: 10, price: '' },
      { min_buyers: 11, max_buyers: 25, price: '' },
      { min_buyers: 26, max_buyers: '', price: '' }
    ]
  });

  const fetchCampaignsAndVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const campData = await smartbuyApi.getCampaigns();
      const campList = campData.results || (Array.isArray(campData) ? campData : []);
      setCampaigns(campList);
      
      // Fetch vendors using smartbuyApi
      try {
        const vendorData = await smartbuyApi.getVendors();
        const vendorList = vendorData.results || (Array.isArray(vendorData) ? vendorData : []);
        setVendors(vendorList);
      } catch (vendorErr) {
        console.error('Error fetching vendors:', vendorErr);
        setVendors([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve campaigns. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndVendors();
  }, []);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  // Handle Close early
  const handleCloseCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to close this campaign early? The price will lock at the current tier.')) return;
    try {
      await smartbuyApi.closeCampaign(id);
      toast.success('Campaign closed successfully.');
      fetchCampaignsAndVendors();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to close campaign.');
    }
  };

  // Handle Cancel campaign
  const handleCancelCampaign = async (id) => {
    if (!window.confirm('WARNING: Cancelling this campaign will notify all buyers and mark their payments for 100% refund. This action is irreversible. Proceed?')) return;
    try {
      await smartbuyApi.cancelCampaign(id);
      toast.success('Campaign cancelled. Refunds initiated.');
      fetchCampaignsAndVendors();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel campaign.');
    }
  };

  // Handle Extend campaign
  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    try {
      await smartbuyApi.extendCampaign(selectedCampaign.id, extendDays);
      toast.success(`Campaign extended by ${extendDays} days.`);
      setShowExtendModal(false);
      fetchCampaignsAndVendors();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to extend campaign.');
    }
  };

  // Handle Clone campaign
  const handleCloneSubmit = async (e) => {
    e.preventDefault();
    try {
      await smartbuyApi.cloneCampaign(selectedCampaign.id, {
        start_date: cloneStartDate,
        duration_days: cloneDuration
      });
      toast.success('Campaign cloned successfully.');
      setShowCloneModal(false);
      fetchCampaignsAndVendors();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to clone campaign.');
    }
  };

  // Pricing Tiers row helpers
  const handleAddTierRow = () => {
    const tiers = [...newCampaign.pricing_tiers];
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier && lastTier.max_buyers ? parseInt(lastTier.max_buyers) + 1 : 1;
    
    tiers.push({
      min_buyers: newMin,
      max_buyers: '',
      price: ''
    });
    setNewCampaign({ ...newCampaign, pricing_tiers: tiers });
  };

  const handleRemoveTierRow = (idx) => {
    const tiers = newCampaign.pricing_tiers.filter((_, i) => i !== idx);
    setNewCampaign({ ...newCampaign, pricing_tiers: tiers });
  };

  const handleTierChange = (idx, field, val) => {
    const tiers = [...newCampaign.pricing_tiers];
    tiers[idx][field] = val;
    setNewCampaign({ ...newCampaign, pricing_tiers: tiers });
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format pricing tiers
      const formattedTiers = newCampaign.pricing_tiers.map(t => ({
        min_buyers: parseInt(t.min_buyers),
        max_buyers: t.max_buyers ? parseInt(t.max_buyers) : null,
        price: parseFloat(t.price)
      }));

      if (parseFloat(newCampaign.cancellation_refund_amount) > parseFloat(newCampaign.token_deposit)) {
        toast.error('Cancellation refund amount cannot exceed the token deposit.');
        return;
      }

      const payload = {
        title: newCampaign.title,
        description: newCampaign.description,
        vendor: parseInt(newCampaign.vendor),
        total_quantity: parseInt(newCampaign.total_quantity),
        duration_days: parseInt(newCampaign.duration_days),
        start_date: newCampaign.start_date,
        token_deposit: parseFloat(newCampaign.token_deposit),
        cancellation_refund_amount: parseFloat(newCampaign.cancellation_refund_amount),
        pricing_tiers: formattedTiers
      };

      await smartbuyApi.createCampaign(payload);
      toast.success('Campaign created successfully.');
      setShowCreateModal(false);
      setCreateStep(1);
      // Reset form
      setNewCampaign({
        title: '',
        description: '',
        vendor: '',
        product_image: '',
        upi_qr_image: '',
        total_quantity: 50,
        duration_days: 14,
        start_date: '',
        token_deposit: '',
        cancellation_refund_amount: '',
        pricing_tiers: [
          { min_buyers: 1, max_buyers: 10, price: '' },
          { min_buyers: 11, max_buyers: 25, price: '' },
          { min_buyers: 26, max_buyers: '', price: '' }
        ]
      });
      fetchCampaignsAndVendors();
    } catch (err) {
      const details = err.response?.data;
      if (typeof details === 'object') {
        const firstErrorKey = Object.keys(details)[0];
        toast.error(`${firstErrorKey}: ${JSON.stringify(details[firstErrorKey])}`);
      } else {
        toast.error(err.response?.data?.detail || 'Failed to create campaign.');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchCampaignsAndVendors} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Campaign Management</h1>
          <p className="mt-2 text-sm text-gray-650">Create, monitor, clone, or moderate SmartBuy group purchase campaigns.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button
            onClick={fetchCampaignsAndVendors}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 font-medium cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl overflow-hidden">
        {['all', 'active', 'closed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-4 text-sm font-semibold border-b-2 uppercase tracking-wider cursor-pointer ${
              filter === tab
                ? 'border-blue-600 text-blue-650 bg-blue-50/20'
                : 'border-transparent text-gray-500 hover:text-gray-750 hover:bg-gray-50/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Campaigns list table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Campaign</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Vendor</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase text-center">Remaining Quantity</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Current price</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-gray-50/30">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{camp.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Start: {formatDate(camp.start_date, 'dd MMM yyyy')}</span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Duration: {camp.duration_days} Days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{camp.vendor_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-gray-900">
                        {camp.available_quantity} / {camp.total_quantity}
                      </div>
                      <div className="w-24 bg-gray-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5"
                          style={{ width: `${Math.min(((camp.total_quantity - camp.available_quantity) / camp.total_quantity) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                        camp.status === 'active' ? 'bg-green-100 text-green-800' :
                        camp.status === 'closed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₹{formatCurrency(camp.current_price)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {camp.status === 'active' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedCampaign(camp);
                              setExtendDays(7);
                              setShowExtendModal(true);
                            }}
                            title="Extend Campaign"
                            className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 text-gray-650 cursor-pointer inline-flex"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCloseCampaign(camp.id)}
                            title="Close Early"
                            className="p-1.5 border border-gray-300 rounded hover:bg-blue-50 text-blue-600 cursor-pointer inline-flex"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelCampaign(camp.id)}
                            title="Cancel Campaign"
                            className="p-1.5 border border-gray-300 rounded hover:bg-red-50 text-red-600 cursor-pointer inline-flex"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCampaign(camp);
                          setCloneStartDate('');
                          setShowCloneModal(true);
                        }}
                        title="Clone Campaign"
                        className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 text-gray-650 cursor-pointer inline-flex"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 font-semibold">
                    No campaigns found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-150 pb-4 mb-4">
              <h3 className="text-xl font-bold text-[#003366]">Create SmartBuy Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-650 text-2xl font-semibold cursor-pointer">
                &times;
              </button>
            </div>

            {/* Stepper Header */}
            <div className="flex items-center justify-center gap-6 mb-6">
              {[1, 2, 3, 4].map(step => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    createStep === step ? 'bg-blue-600 text-white' : 
                    createStep > step ? 'bg-green-500 text-white' : 
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    createStep === step ? 'text-blue-650' : 'text-gray-400'
                  }`}>
                    {step === 1 ? 'Vendor' : step === 2 ? 'Details' : step === 3 ? 'Pricing' : 'Quantity'}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* Step 1: Vendor */}
              {createStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Select Vendor</label>
                    <select
                      value={newCampaign.vendor}
                      onChange={(e) => setNewCampaign({ ...newCampaign, vendor: e.target.value })}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-3 border"
                      required
                    >
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.contact_person})</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Only active vendors can be chosen. Ensure you register vendors before creating campaigns.</p>
                </div>
              )}

              {/* Step 2: Details */}
              {createStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Campaign Title</label>
                    <input
                      type="text"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                      placeholder="e.g. Dell Latitude 5540 Laptop"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      placeholder="Enter detailed specifications, terms & conditions..."
                      rows="4"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Pricing Tiers */}
              {createStep === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-gray-800">Dynamic Pricing Tiers</h4>
                    <button
                      type="button"
                      onClick={handleAddTierRow}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Tier
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newCampaign.pricing_tiers.map((tier, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="block font-bold text-gray-650 mb-0.5">Min Buyers</label>
                            <input
                              type="number"
                              value={tier.min_buyers}
                              onChange={(e) => handleTierChange(idx, 'min_buyers', e.target.value)}
                              className="w-full rounded border-gray-300 py-1 px-2 border"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-650 mb-0.5">Max Buyers (Blank = ∞)</label>
                            <input
                              type="number"
                              value={tier.max_buyers}
                              placeholder="Infinity"
                              onChange={(e) => handleTierChange(idx, 'max_buyers', e.target.value)}
                              className="w-full rounded border-gray-300 py-1 px-2 border"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-650 mb-0.5">Unit Price (₹)</label>
                            <input
                              type="number"
                              value={tier.price}
                              placeholder="Price"
                              onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                              className="w-full rounded border-gray-300 py-1 px-2 border"
                              required
                            />
                          </div>
                        </div>
                        {newCampaign.pricing_tiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTierRow(idx)}
                            className="text-red-500 hover:text-red-750 cursor-pointer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Duration & Stock */}
              {createStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Total Quantity Available</label>
                      <input
                        type="number"
                        value={newCampaign.total_quantity}
                        onChange={(e) => setNewCampaign({ ...newCampaign, total_quantity: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Duration (Days)</label>
                      <input
                        type="number"
                        value={newCampaign.duration_days}
                        onChange={(e) => setNewCampaign({ ...newCampaign, duration_days: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Token Deposit (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newCampaign.token_deposit}
                        onChange={(e) => setNewCampaign({ ...newCampaign, token_deposit: e.target.value })}
                        placeholder="e.g. 500"
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Refund Amount on Cancel (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newCampaign.cancellation_refund_amount}
                        onChange={(e) => setNewCampaign({ ...newCampaign, cancellation_refund_amount: e.target.value })}
                        placeholder="e.g. 250"
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={newCampaign.start_date}
                      onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step Action Buttons */}
              <div className="flex justify-between items-center border-t border-gray-150 pt-4 mt-6">
                <button
                  type="button"
                  disabled={createStep === 1}
                  onClick={() => setCreateStep(createStep - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                {createStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (createStep === 1 && !newCampaign.vendor) {
                        toast.error('Please select a vendor.');
                        return;
                      }
                      if (createStep === 2 && (!newCampaign.title || !newCampaign.description)) {
                        toast.error('Please enter a title and description.');
                        return;
                      }
                      setCreateStep(createStep + 1);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Finish & Create
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND MODAL */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-[#003366] border-b border-gray-150 pb-3 mb-4">Extend Campaign Duration</h3>
            <form onSubmit={handleExtendSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Add Days</label>
                <input
                  type="number"
                  min="1"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 py-2 px-3 border shadow-sm"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">This will extend the closing deadline date of the campaign accordingly.</p>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Extend Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLONE MODAL */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-[#003366] border-b border-gray-150 pb-3 mb-4">Clone Campaign</h3>
            <form onSubmit={handleCloneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">New Start Date</label>
                <input
                  type="datetime-local"
                  value={cloneStartDate}
                  onChange={(e) => setCloneStartDate(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 py-2 px-3 border shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">New Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={cloneDuration}
                  onChange={(e) => setCloneDuration(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 py-2 px-3 border shadow-sm"
                  required
                />
              </div>
              <p className="text-xs text-gray-550">Cloning creates a fresh copy of the campaign with original pricing tiers but resets all buyer bookings.</p>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Clone Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;
