import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { smartbuyApi } from '../../api/smartbuy';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Clock, Users, ArrowRight } from 'lucide-react';

const CampaignListPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await smartbuyApi.getCampaigns({ status: 'active' });
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Could not fetch active campaigns. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchCampaigns} />;
  if (campaigns.length === 0) {
    return (
      <EmptyState
        title="No Active Campaigns"
        message="There are no active SmartBuy group buying campaigns right now. Check back soon!"
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">SmartBuy Campaigns</h1>
        <p className="mt-2 text-sm text-gray-650">
          Join forces with other employees to hit buyer milestones and unlock deep volume discounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => {
          const progressPercent = Math.min(
            ((campaign.total_quantity - campaign.available_quantity) / campaign.total_quantity) * 100,
            100
          );
          
          return (
            <div
              key={campaign.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {/* Product Image */}
              <div className="h-48 bg-gray-100 relative">
                {campaign.product_image ? (
                  <img
                    src={campaign.product_image}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                    No Image
                  </div>
                )}
                {/* Status Badge */}
                <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                  Active
                </span>
              </div>

              {/* Campaign details */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-2">
                  {campaign.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {campaign.description}
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-gray-550 mb-1">
                    <span>
                      {campaign.total_quantity - campaign.available_quantity} / {campaign.total_quantity} Reserved
                    </span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mb-4 text-xs font-medium text-gray-550">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>Ends {formatDate(campaign.end_date, 'dd MMM')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>₹{formatCurrency(campaign.current_price)}</span>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => navigate(`/smartbuy/${campaign.id}`)}
                  className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignListPage;
