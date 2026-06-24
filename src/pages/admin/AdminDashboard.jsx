import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import {
  LayoutDashboard, Users, ShoppingBag, ShoppingCart, AlertCircle,
  RefreshCw, TrendingUp, DollarSign, Eye, Award, Clock, Tag,
  Activity, Calendar,
} from 'lucide-react';

// ─── Reusable Stat Card ─────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all' : ''}`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-gray-900 leading-none">{value ?? '—'}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

// ─── Section Header ──────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="w-5 h-5 text-[#003366]" />
    <h2 className="text-base font-bold text-[#003366] uppercase tracking-wide">{title}</h2>
  </div>
);

// ─── Main Admin Dashboard Component ─────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [errorMetrics, setErrorMetrics] = useState(null);
  const [errorAnalytics, setErrorAnalytics] = useState(null);

  // Fetch dashboard stats
  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    setErrorMetrics(null);
    try {
      const data = await adminApi.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setErrorMetrics('Failed to load dashboard metrics. Ensure the backend is running.');
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // Fetch analytics data (cached 10 min on backend)
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setErrorAnalytics(null);
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setErrorAnalytics('Failed to load analytics data.');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchAnalytics();
  }, [fetchMetrics, fetchAnalytics]);

  const handleRefreshAll = () => {
    fetchMetrics();
    fetchAnalytics();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live overview of platform activity, pending actions, and analytics.
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh All
        </button>
      </div>

      {/* ── Metrics Grid ───────────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={Activity} title="Platform Metrics" />
        {loadingMetrics ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : errorMetrics ? (
          <ErrorState message={errorMetrics} onRetry={fetchMetrics} />
        ) : metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard
              icon={ShoppingCart}
              label="Active Campaigns"
              value={metrics.active_campaigns}
              color="bg-blue-600"
              onClick={() => navigate('/admin/campaigns')}
            />
            <StatCard
              icon={Archive}
              label="Closed Campaigns"
              value={metrics.closed_campaigns}
              color="bg-slate-500"
              onClick={() => navigate('/admin/campaigns')}
            />
            <StatCard
              icon={ShoppingBag}
              label="Active Listings"
              value={metrics.active_listings}
              color="bg-green-600"
            />
            <StatCard
              icon={AlertCircle}
              label="Pending Listings"
              value={metrics.pending_listings}
              color="bg-yellow-500"
              onClick={() => navigate('/admin/listings')}
            />
            <StatCard
              icon={Users}
              label="Total Employees"
              value={metrics.total_users}
              color="bg-purple-600"
              onClick={() => navigate('/admin/users')}
            />
            <StatCard
              icon={Users}
              label="New This Month"
              value={metrics.new_users_this_month}
              color="bg-indigo-500"
            />

            <StatCard
              icon={RefreshCw}
              label="Pending Refunds"
              value={metrics.pending_refunds}
              color={metrics.pending_refunds > 0 ? 'bg-red-500' : 'bg-gray-400'}
              onClick={() => navigate('/admin/payments')}
            />
          </div>
        ) : null}
      </section>

      {/* ── Recent Activity ─────────────────────────────────────────────────── */}
      {metrics?.recent_activity?.length > 0 && (
        <section>
          <SectionHeader icon={Clock} title="Recent Admin Activity" />
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Admin</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Target</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Time</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {metrics.recent_activity.map((log, i) => (
                    <tr key={i} className="hover:bg-gray-50/40">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {log['admin_user__name']}
                        <span className="ml-1 text-xs text-gray-400">({log['admin_user__employee_id']})</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${
                          log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                          log.action === 'POST' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {log.target_model}
                        {log.target_id ? <span className="text-gray-400"> #{log.target_id}</span> : null}
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Analytics Section ───────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={TrendingUp} title="Analytics" />
        {loadingAnalytics ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : errorAnalytics ? (
          <ErrorState message={errorAnalytics} onRetry={fetchAnalytics} />
        ) : analytics ? (
          <div className="space-y-6">

            {/* Payment Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Total Tokens Collected</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  ₹{Number(analytics.payment_summary?.total_submitted || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Tokens Approved</p>
                <p className="text-2xl font-extrabold text-green-700">
                  ₹{Number(analytics.payment_summary?.total_approved || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* New Users Per Month & Top Campaigns side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* New Users Per Month */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-[#003366]" />
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">New Employees (Last 6 Months)</h3>
                </div>
                {analytics.new_users_per_month?.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.new_users_per_month.map((item, i) => {
                      const label = new Date(item.month).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
                      const maxCount = Math.max(...analytics.new_users_per_month.map(m => m.count));
                      const widthPct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-16 text-xs text-gray-500 font-medium shrink-0">{label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#003366] h-2 rounded-full transition-all"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          <span className="w-6 text-xs font-bold text-gray-700 text-right">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No data for the last 6 months.</p>
                )}
              </div>

              {/* Top 5 Campaigns by Registrations */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-[#003366]" />
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Top Campaigns by Registrations</h3>
                </div>
                {analytics.top_5_campaigns_by_registrations?.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.top_5_campaigns_by_registrations.map((camp, i) => (
                      <div key={camp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#003366] text-white text-xs flex items-center justify-center font-bold shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-800 font-medium truncate">{camp.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            camp.status === 'active' ? 'bg-green-100 text-green-700' :
                            camp.status === 'closed' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>{camp.status}</span>
                          <span className="text-sm font-bold text-gray-900">{camp.registration_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No campaign data available.</p>
                )}
              </div>
            </div>

            {/* Top 10 Most Viewed Listings & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top 10 Viewed Listings */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-[#003366]" />
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Most Viewed Listings</h3>
                </div>
                {analytics.top_10_viewed_listings?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase font-bold">
                          <th className="text-left pb-2">Title</th>
                          <th className="text-right pb-2">Views</th>
                          <th className="text-right pb-2">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {analytics.top_10_viewed_listings.map((listing) => (
                          <tr key={listing.id} className="hover:bg-gray-50/40">
                            <td className="py-2 font-medium text-gray-800 truncate max-w-[140px]">{listing.title}</td>
                            <td className="py-2 text-right font-bold text-blue-700">{listing.views.toLocaleString()}</td>
                            <td className="py-2 text-right text-gray-600">₹{Number(listing.price).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No listing data available.</p>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-[#003366]" />
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Listings by Category</h3>
                </div>
                {analytics.category_breakdown?.filter(c => c.listing_count > 0).length > 0 ? (
                  <div className="space-y-2">
                    {analytics.category_breakdown
                      .filter(c => c.listing_count > 0)
                      .slice(0, 8)
                      .map((cat) => {
                        const max = analytics.category_breakdown[0]?.listing_count || 1;
                        const widthPct = (cat.listing_count / max) * 100;
                        return (
                          <div key={cat.id} className="flex items-center gap-3">
                            <span className="w-28 text-xs text-gray-600 font-medium truncate shrink-0">{cat.name}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-indigo-500 h-2 rounded-full transition-all"
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                            <span className="w-6 text-xs font-bold text-gray-700 text-right">{cat.listing_count}</span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No category data available.</p>
                )}
              </div>
            </div>

            {analytics.generated_at && (
              <p className="text-xs text-gray-400 text-right">
                Analytics cached at: {new Date(analytics.generated_at).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
};

// Missing icon — add Archive locally since it wasn't in the import
function Archive({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

export default AdminDashboard;
