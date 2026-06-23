import axiosInstance from './axiosInstance';

// API calls for SmartBuy Campaigns and Registrations
export const smartbuyApi = {
  // List all active campaigns
  getCampaigns: async (params = {}) => {
    const response = await axiosInstance.get('/api/smartbuy/campaigns/', { params });
    return response.data;
  },

  // Get detail of a single campaign
  getCampaignDetail: async (id) => {
    const response = await axiosInstance.get(`/api/smartbuy/campaigns/${id}/`);
    return response.data;
  },

  // Create campaign (Admin only)
  createCampaign: async (campaignData) => {
    const response = await axiosInstance.post('/api/smartbuy/campaigns/', campaignData);
    return response.data;
  },

  // Edit campaign (Admin only)
  editCampaign: async (id, campaignData) => {
    const response = await axiosInstance.put(`/api/smartbuy/campaigns/${id}/`, campaignData);
    return response.data;
  },

  // Close campaign manually (Admin only)
  closeCampaign: async (id) => {
    const response = await axiosInstance.post(`/api/smartbuy/campaigns/${id}/close/`);
    return response.data;
  },

  // Cancel campaign (Admin only)
  cancelCampaign: async (id) => {
    const response = await axiosInstance.post(`/api/smartbuy/campaigns/${id}/cancel/`);
    return response.data;
  },

  // Extend campaign duration by N days (Admin only)
  extendCampaign: async (id, days) => {
    const response = await axiosInstance.post(`/api/smartbuy/campaigns/${id}/extend/`, { days });
    return response.data;
  },

  // Clone campaign with new dates (Admin only)
  cloneCampaign: async (id, newDates) => {
    const response = await axiosInstance.post(`/api/smartbuy/campaigns/${id}/clone/`, newDates);
    return response.data;
  },

  // Register for a campaign (Atomic decrement, creates registration)
  registerCampaign: async (id) => {
    const response = await axiosInstance.post(`/api/smartbuy/campaigns/${id}/register/`);
    return response.data;
  },

  // Join waitlist when campaign inventory is sold out
  joinWaitlist: async (id) => {
    const response = await axiosInstance.post(`/api/smartbuy/campaigns/${id}/waitlist/`);
    return response.data;
  },

  // Submit payment QR screenshot for campaign registration
  submitPayment: async (campaignId, screenshotFile) => {
    const formData = new FormData();
    formData.append('upi_screenshot', screenshotFile);
    const response = await axiosInstance.post(`/api/smartbuy/campaigns/${campaignId}/submit-payment/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cancel registration and show/process backout penalty
  cancelRegistration: async (campaignId) => {
    const response = await axiosInstance.post(`/api/smartbuy/campaigns/${campaignId}/cancel-registration/`);
    return response.data;
  },

  // Create Cashfree payment order (returns payment_session_id)
  createOrder: async (campaignId) => {
    const response = await axiosInstance.post(`/api/smartbuy/campaigns/${campaignId}/create-order/`);
    return response.data;
  },

  // Verify Cashfree payment status directly with Cashfree
  verifyPayment: async (orderId) => {
    const response = await axiosInstance.get(`/api/payments/cashfree-verify/${orderId}/`);
    return response.data;
  },

  // Vendors management
  getVendors: async () => {
    const response = await axiosInstance.get('/api/smartbuy/vendors/');
    return response.data;
  },

  createVendor: async (vendorData) => {
    const response = await axiosInstance.post('/api/smartbuy/vendors/', vendorData);
    return response.data;
  },

  updateVendor: async (id, vendorData) => {
    const response = await axiosInstance.put(`/api/smartbuy/vendors/${id}/`, vendorData);
    return response.data;
  },

  deleteVendor: async (id) => {
    const response = await axiosInstance.delete(`/api/smartbuy/vendors/${id}/`);
    return response.data;
  },
};
