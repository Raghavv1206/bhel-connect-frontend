import axiosInstance from './axiosInstance';

// API calls for Admin Control Panel Operations
export const adminApi = {
  // Get admin dashboard metrics (campaigns, listings, user count, pending items)
  getDashboardMetrics: async () => {
    const response = await axiosInstance.get('/api/admin/dashboard/');
    return response.data;
  },

  // Get pending listings queue for moderation
  getPendingListings: async (params = {}) => {
    const response = await axiosInstance.get('/api/marketplace/listings/pending/', { params });
    return response.data;
  },

  // Approve a listing (status becomes 'available')
  approveListing: async (id) => {
    const response = await axiosInstance.post(`/api/marketplace/listings/${id}/approve/`);
    return response.data;
  },

  // Reject a listing with a specified reason
  rejectListing: async (id, reason) => {
    const response = await axiosInstance.post(`/api/marketplace/listings/${id}/reject/`, {
      rejection_reason: reason,
    });
    return response.data;
  },

  // Remove / delete a listing (moderation)
  deleteListing: async (id) => {
    const response = await axiosInstance.delete(`/api/marketplace/listings/${id}/remove/`);
    return response.data;
  },

  // Get all pending payment verification screenshots
  getPendingPayments: async () => {
    const response = await axiosInstance.get('/api/admin/payments/pending/');
    return response.data;
  },

  // Approve campaign payment
  approvePayment: async (paymentId) => {
    const response = await axiosInstance.post(`/api/admin/payments/${paymentId}/approve/`);
    return response.data;
  },

  // Reject campaign payment with reason
  rejectPayment: async (paymentId, reason) => {
    const response = await axiosInstance.post(`/api/admin/payments/${paymentId}/reject/`, {
      rejection_reason: reason,
    });
    return response.data;
  },

  // Get pending refunds list (from cancelled campaigns or backouts)
  getPendingRefunds: async () => {
    const response = await axiosInstance.get('/api/admin/refunds/pending/');
    return response.data;
  },

  // Mark a refund as processed (since refunding is manual via UPI/cash)
  processRefund: async (refundId) => {
    const response = await axiosInstance.post(`/api/admin/refunds/${refundId}/process/`);
    return response.data;
  },

  // Step 8.8 — Aggregated analytics data (cached 10 min on backend)
  getAnalytics: async () => {
    const response = await axiosInstance.get('/api/admin/analytics/');
    return response.data;
  },

  // Step 8.7 — Upload a CSV file to bulk-create/update employees
  // csvFile: a File object from <input type="file">
  bulkImportEmployees: async (csvFile) => {
    const formData = new FormData();
    formData.append('file', csvFile);
    const response = await axiosInstance.post('/api/admin/users/bulk-import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Download Campaign Buyers report
  downloadCampaignBuyersReport: async (campaignId, format) => {
    const response = await axiosInstance.get(`/api/reports/campaign/${campaignId}/buyers/`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Download Campaign Waitlist report
  downloadCampaignWaitlistReport: async (campaignId, format) => {
    const response = await axiosInstance.get(`/api/reports/campaign/${campaignId}/waitlist/`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Download Marketplace Summary report (Excel only)
  downloadMarketplaceReport: async () => {
    const response = await axiosInstance.get('/api/reports/marketplace/', {
      params: { format: 'excel' },
      responseType: 'blob',
    });
    return response.data;
  },
};
