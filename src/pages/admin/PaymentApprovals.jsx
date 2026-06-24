import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { toast } from 'react-hot-toast';
import { DollarSign, RefreshCw } from 'lucide-react';

const PaymentApprovals = () => {
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const refunds = await adminApi.getPendingRefunds();
      const list = refunds.results || (Array.isArray(refunds) ? refunds : []);
      setPendingRefunds(list);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve pending refunds. Verify authentication and server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Process Refund disbursal
  const handleProcessRefund = async (refundId) => {
    if (!window.confirm('Verify that you have manually transferred/UPI refunded the amount to this employee?')) return;
    try {
      await adminApi.processRefund(refundId);
      toast.success('Refund marked as successfully disbursed.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to process refund.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Refund Operations</h1>
          <p className="mt-2 text-sm text-gray-650">Verify and process manual UPI/cash refunds for cancelled campaign registrations.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 font-medium cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* REFUNDS LISTING */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Employee Details</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Campaign Title</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Original Token</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Refund Due</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Cancellation Date</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {pendingRefunds.length > 0 ? (
                pendingRefunds.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50/30">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{ref.employee_name}</div>
                      <div className="text-xs text-gray-500">ID: {ref.employee_id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-650 font-medium">{ref.campaign_title}</td>
                    <td className="px-6 py-4 text-gray-500">₹{formatCurrency(ref.token_amount)}</td>
                    <td className="px-6 py-4 font-extrabold text-red-650">₹{formatCurrency(ref.refund_amount)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(ref.cancellation_date, 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleProcessRefund(ref.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm ml-auto cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Disburse Refund
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 font-semibold">
                    No pending refunds awaiting processing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentApprovals;
