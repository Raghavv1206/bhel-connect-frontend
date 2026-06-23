import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { smartbuyApi } from '../../api/smartbuy';
import { toast } from 'react-hot-toast';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  TrendingUp,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';

const ReportsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState(null);

  // Track independent loading states for each download button
  const [loadingStates, setLoadingStates] = useState({
    buyersExcel: false,
    buyersPdf: false,
    waitlistExcel: false,
    waitlistPdf: false,
    marketplaceExcel: false,
  });

  // Fetch campaigns on load
  useEffect(() => {
    const fetchCampaigns = async () => {
      setCampaignsLoading(true);
      setCampaignsError(null);
      try {
        const response = await smartbuyApi.getCampaigns();
        // Support both list and paginated objects
        const campaignsList = Array.isArray(response) 
          ? response 
          : (response.results || response.data || []);
        setCampaigns(campaignsList);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setCampaignsError('Failed to load campaigns for selection.');
        toast.error('Failed to load campaigns.');
      } finally {
        setCampaignsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Generic helper for triggering blob downloads
  const triggerDownload = async (apiCallFn, defaultFilename, key) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const blob = await apiCallFn();
      
      // Create download link in browser
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`${defaultFilename} downloaded successfully.`);
    } catch (err) {
      console.error(`Error downloading report for ${key}:`, err);
      // Attempt to extract error message if the backend returned JSON inside the blob
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          toast.error(parsed.detail || 'Failed to download report.');
        } catch {
          toast.error('Failed to download report.');
        }
      } else {
        toast.error(err.response?.data?.detail || 'Failed to generate report. Check connection.');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleBuyersDownload = (format) => {
    if (!selectedCampaignId) return;
    const campaign = campaigns.find(c => c.id === parseInt(selectedCampaignId));
    const title = campaign ? campaign.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : selectedCampaignId;
    const filename = `campaign_${title}_buyers.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    const key = format === 'excel' ? 'buyersExcel' : 'buyersPdf';

    triggerDownload(
      () => adminApi.downloadCampaignBuyersReport(selectedCampaignId, format),
      filename,
      key
    );
  };

  const handleWaitlistDownload = (format) => {
    if (!selectedCampaignId) return;
    const campaign = campaigns.find(c => c.id === parseInt(selectedCampaignId));
    const title = campaign ? campaign.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : selectedCampaignId;
    const filename = `campaign_${title}_waitlist.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    const key = format === 'excel' ? 'waitlistExcel' : 'waitlistPdf';

    triggerDownload(
      () => adminApi.downloadCampaignWaitlistReport(selectedCampaignId, format),
      filename,
      key
    );
  };

  const handleMarketplaceDownload = () => {
    const filename = `marketplace_summary_${new Date().toISOString().slice(0,10)}.xlsx`;
    triggerDownload(
      () => adminApi.downloadMarketplaceReport(),
      filename,
      'marketplaceExcel'
    );
  };

  const selectedCampaign = campaigns.find(c => c.id === parseInt(selectedCampaignId));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight flex items-center gap-2">
          <FileText className="w-8 h-8 text-[#003366]" />
          Reports & Financial Export
        </h1>
        <p className="mt-2 text-sm text-gray-500 max-w-2xl">
          Generate BHEL-branded reports and audits for group-buy campaigns and user-to-user marketplace activity. All reports are produced in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: SmartBuy Campaign Reports */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-[#003366]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">SmartBuy Campaign Reports</h2>
              <p className="text-xs text-gray-400">Excel and PDF reports on registrations, payments, and waitlists</p>
            </div>
          </div>

          <hr className="border-gray-100 my-2" />

          {/* Campaign Selector */}
          <div className="my-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Select Campaign
            </label>
            {campaignsLoading ? (
              <div className="flex items-center gap-2 py-2.5 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#003366]" />
                Loading campaigns...
              </div>
            ) : campaignsError ? (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{campaignsError}</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full pl-3 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium cursor-pointer appearance-none transition-all"
                >
                  <option value="">-- Choose a Group Buy Campaign --</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.status ? c.status.toUpperCase() : 'ACTIVE'})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {selectedCampaign && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-6 text-xs text-gray-600 space-y-1">
              <div><span className="font-semibold text-gray-800">Total Units:</span> {selectedCampaign.total_quantity}</div>
              <div><span className="font-semibold text-gray-800">Available:</span> {selectedCampaign.available_quantity}</div>
              <div><span className="font-semibold text-gray-800">Confirmed Buyers:</span> {selectedCampaign.confirmed_buyers_count ?? 'N/A'}</div>
              <div><span className="font-semibold text-gray-800">Waitlist Size:</span> {selectedCampaign.waitlisted_count ?? 'N/A'}</div>
            </div>
          )}

          {/* Action Grid */}
          <div className="space-y-4 mt-auto">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Campaign Buyers List</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleBuyersDownload('excel')}
                  disabled={!selectedCampaignId || loadingStates.buyersExcel}
                  className="flex items-center justify-center gap-1.5 py-3 border border-green-200 text-green-700 bg-green-50/50 hover:bg-green-50 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-green-50/50 cursor-pointer"
                >
                  {loadingStates.buyersExcel ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  Excel Sheet
                </button>
                <button
                  onClick={() => handleBuyersDownload('pdf')}
                  disabled={!selectedCampaignId || loadingStates.buyersPdf}
                  className="flex items-center justify-center gap-1.5 py-3 border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-red-50/50 cursor-pointer"
                >
                  {loadingStates.buyersPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  PDF Report
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Campaign Waitlist List</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleWaitlistDownload('excel')}
                  disabled={!selectedCampaignId || loadingStates.waitlistExcel}
                  className="flex items-center justify-center gap-1.5 py-3 border border-green-200 text-green-700 bg-green-50/50 hover:bg-green-50 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-green-50/50 cursor-pointer"
                >
                  {loadingStates.waitlistExcel ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  Excel Sheet
                </button>
                <button
                  onClick={() => handleWaitlistDownload('pdf')}
                  disabled={!selectedCampaignId || loadingStates.waitlistPdf}
                  className="flex items-center justify-center gap-1.5 py-3 border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-red-50/50 cursor-pointer"
                >
                  {loadingStates.waitlistPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  PDF Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Marketplace Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Marketplace Audit Summary</h2>
              <p className="text-xs text-gray-400">Consolidated Excel workbook containing metrics, categories & top sellers</p>
            </div>
          </div>

          <hr className="border-gray-100 my-2" />

          <div className="my-6">
            <p className="text-sm text-gray-500 leading-relaxed">
              Downloads a multi-sheet Excel file auditing BHEL Connect Marketplace:
            </p>
            <ul className="mt-4 space-y-2 text-xs text-gray-600 list-disc list-inside">
              <li><span className="font-semibold text-gray-700">Sheet 1: Summary</span> — Listing counts by status (Active, Sold, Pending, Rejected).</li>
              <li><span className="font-semibold text-gray-700">Sheet 2: Category Breakdown</span> — Count and total sold volume in INR per category.</li>
              <li><span className="font-semibold text-gray-700">Sheet 3: Top Sellers</span> — Leaderboard of employee sellers by listings and successful sales.</li>
            </ul>
          </div>

          {/* Action button */}
          <div className="mt-auto pt-6">
            <button
              onClick={handleMarketplaceDownload}
              disabled={loadingStates.marketplaceExcel}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#003366] hover:bg-blue-900 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all disabled:opacity-60 disabled:hover:bg-[#003366]"
            >
              {loadingStates.marketplaceExcel ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              Download Marketplace Summary (Excel)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;
