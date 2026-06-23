import axiosInstance from './axiosInstance';

// API calls for Employee Marketplace listings, images, and categories
export const marketplaceApi = {
  // Get active marketplace listings (supports filters: category, search, min/max price, condition, ordering)
  getListings: async (params = {}) => {
    const response = await axiosInstance.get('/api/marketplace/listings/', { params });
    return response.data;
  },

  // Get detail of a specific listing (increments view count on server)
  getListingDetail: async (id) => {
    const response = await axiosInstance.get(`/api/marketplace/listings/${id}/`);
    return response.data;
  },

  // Create new listing (starts in 'pending' status). Uses multipart/form-data for image uploads.
  createListing: async (formData) => {
    const response = await axiosInstance.post('/api/marketplace/listings/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Edit own listing (cannot edit if status is sold)
  editListing: async (id, formData) => {
    const response = await axiosInstance.put(`/api/marketplace/listings/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update listing status (available -> reserved -> sold)
  updateListingStatus: async (id, status) => {
    const response = await axiosInstance.patch(`/api/marketplace/listings/${id}/status/`, { status });
    return response.data;
  },

  // Get all categories (hierarchical parent-child categories)
  getCategories: async () => {
    const response = await axiosInstance.get('/api/marketplace/categories/');
    return response.data;
  },

  // Get employee's saved products
  getSavedProducts: async () => {
    const response = await axiosInstance.get('/api/users/saved-products/');
    return response.data;
  },

  // Add a listing to saved products list
  saveProduct: async (listingId) => {
    const response = await axiosInstance.post('/api/users/saved-products/', { marketplace_listing_id: listingId });
    return response.data;
  },

  // Remove a listing from saved products list
  unsaveProduct: async (listingId) => {
    const response = await axiosInstance.delete(`/api/users/saved-products/${listingId}/`);
    return response.data;
  },

  // Get active chat conversations
  getConversations: async () => {
    const response = await axiosInstance.get('/api/marketplace/chats/');
    return response.data;
  },
};
