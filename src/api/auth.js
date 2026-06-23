import axiosInstance from './axiosInstance';

// API calls for User Authentication & Profile
export const authApi = {
  // Submit Employee ID + Email to request OTP
  requestOtp: async (employeeId, email) => {
    const response = await axiosInstance.post('/api/auth/request-otp/', {
      employee_id: employeeId,
      email: email,
    });
    return response.data;
  },

  // Submit Employee ID + 6-digit OTP to verify and get JWT tokens
  verifyOtp: async (employeeId, otpCode) => {
    const response = await axiosInstance.post('/api/auth/verify-otp/', {
      employee_id: employeeId,
      otp_code: otpCode,
    });
    return response.data;
  },

  // Blacklist the refresh token to logout
  logout: async (refreshToken) => {
    const response = await axiosInstance.post('/api/auth/logout/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  // Get logged-in employee profile
  getProfile: async () => {
    const response = await axiosInstance.get('/api/users/profile/');
    return response.data;
  },

  // Update profile mobile number or profile picture
  updateProfile: async (formData) => {
    const response = await axiosInstance.patch('/api/users/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get campaign registrations/purchases for the logged-in employee
  getMyPurchases: async () => {
    const response = await axiosInstance.get('/api/users/my-purchases/');
    return response.data;
  },

  // Get listings created by the logged-in employee
  getMyListings: async () => {
    const response = await axiosInstance.get('/api/users/my-listings/');
    return response.data;
  },

  // Get token payment history for the logged-in employee
  getTokenHistory: async () => {
    const response = await axiosInstance.get('/api/users/token-history/');
    return response.data;
  },
};
