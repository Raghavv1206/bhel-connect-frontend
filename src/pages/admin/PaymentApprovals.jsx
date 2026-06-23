import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { toast } from 'react-hot-toast';
import { 
  Check, X, Eye, DollarSign, RefreshCw, FileImage 
} from 'lucide-react';

const PaymentApprovals = () => {
  const [activeTab, setActiveTab] = useState('deposits');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Image View
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'deposits') {
        const payments = await adminApi.getPendingPayments();
        setPendingPayments(payments);
      } else {
        const refunds = await adminApi.getPendingRefunds();
        setPendingRefunds(refunds);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve payment approvals. Verify authentication and server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Approve payment deposit
  const handleApprovePayment = async (paymentId) => {
    if (!window.confirm('Confirm that the UPI payment details have been verified on your bank dashboard?')) return;
    try {
      await adminApi.approvePayment(paymentId);
      toast.success('Deposit approved! Campaign slot is confirmed.');
      setSelectedPayment(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve payment.');
    }
  };

  // Reject payment deposit
  const handleRejectPayment = async (e) => {
    e.preventDefault();
    if (!rejectionReason.strip()) {
      toast.error('Please provide a rejection explanation.');
      return;
    }
    try {
      await adminApi.rejectPayment(selectedPayment.id, rejectionReason);
      toast.success('Deposit rejected. User notified.');
      setSelectedPayment(null);
      setRejectionReason('');
      setShowRejectInput(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject payment.');
    }
  };

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
          <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Payment Operations</h1>
          <p className="mt-2 text-sm text-gray-650">Verify manual UPI deposit screenshots and disburse cancellations refunds.</p>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl overflow-hidden">
        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-5 py-4 text-sm font-semibold border-b-2 uppercase tracking-wider cursor-pointer ${
            activeTab === 'deposits'
              ? 'border-blue-600 text-blue-650 bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-750 hover:bg-gray-50/50'
          }`}
        >
          Deposit Approvals
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-5 py-4 text-sm font-semibold border-b-2 uppercase tracking-wider cursor-pointer ${
            activeTab === 'refunds'
              ? 'border-blue-600 text-blue-650 bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-750 hover:bg-gray-50/50'
          }`}
        >
          Refund Disbursals
        </button>
      </div>

      {/* DEPOSITS LISTING */}
      {activeTab === 'deposits' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Employee Details</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Campaign Title</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Token Amount</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Submission Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Verification Key</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {pendingPayments.length > 0 ? (
                  pendingPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{pay.employee_name}</div>
                        <div className="text-xs text-gray-500">ID: {pay.employee_id}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{pay.campaign_title}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{formatCurrency(pay.amount)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(pay.submitted_at, 'dd MMM yyyy HH:mm')}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {pay.cashfree_order_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedPayment(pay);
                            setShowRejectInput(false);
                            setRejectionReason('');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 border border-blue-600 text-blue-650 hover:bg-blue-50 rounded text-xs font-semibold shadow-sm ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review proof
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500 font-semibold">
                      No pending deposits awaiting verification.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REFUNDS LISTING */}
      {activeTab === 'refunds' && (
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
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm ml-auto cursor-pointer"
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
      )}

      {/* PROOF REVIEW MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-150 pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#003366]">Review Deposit Proof</h3>
              <button 
                onClick={() => setSelectedPayment(null)} 
                className="text-gray-400 hover:text-gray-650 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Employee/Payment metadata info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-150 text-xs">
                <div>
                  <span className="block font-bold text-gray-500 uppercase">Employee name</span>
                  <span className="font-semibold text-gray-900">{selectedPayment.employee_name} ({selectedPayment.employee_id})</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-500 uppercase">Campaign</span>
                  <span className="font-semibold text-gray-900">{selectedPayment.campaign_title}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-500 uppercase">Token deposit due</span>
                  <span className="font-bold text-gray-900">₹{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-500 uppercase">Verification Reference ID</span>
                  <span className="font-mono text-gray-700">{selectedPayment.cashfree_order_id}</span>
                </div>
              </div>

              {/* Screenshot preview */}
              <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200 p-2 min-h-64 flex flex-col justify-center">
                {selectedPayment.upi_screenshot || (selectedPayment.registration && selectedPayment.registration.upi_screenshot) ? (
                  <img
                    src={selectedPayment.upi_screenshot || selectedPayment.registration.upi_screenshot}
                    alt="UPI payment deposit receipt"
                    className="max-h-96 w-full object-contain mx-auto rounded"
                  />
                ) : (
                  <div className="text-center text-gray-400 py-12 flex flex-col items-center">
                    <FileImage className="w-12 h-12 text-gray-300 mb-2" />
                    <span>No proof screenshot was uploaded.</span>
                  </div>
                )}
              </div>

              {/* Rejection input field */}
              {showRejectInput && (
                <form onSubmit={handleRejectPayment} className="space-y-3 border-t border-gray-150 pt-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-750 mb-1">
                      Reason for Rejection
                    </label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Transaction reference ID missing or amount mismatched."
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 py-2 px-3 border text-sm"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white rounded-md text-xs font-bold cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Default Approval Actions */}
            {!showRejectInput && (
              <div className="flex gap-3 border-t border-gray-150 pt-4 mt-4 justify-end">
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-4 py-2 border border-red-300 hover:bg-red-50 text-red-600 rounded-lg text-sm font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" /> Reject Deposit
                </button>
                <button
                  onClick={() => handleApprovePayment(selectedPayment.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Approve Deposit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentApprovals;
