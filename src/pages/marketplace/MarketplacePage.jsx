import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceApi } from '../../api/marketplace';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, SlidersHorizontal, Tag, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MarketplacePage = () => {
  const navigate = useNavigate();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Data State
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catData = await marketplaceApi.getCategories();
        setCategories(catData);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Reset page to 1 on filter or search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedCondition, minPrice, maxPrice, sortBy]);

  // Fetch listings on filter changes
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        search: debouncedSearch,
        category: selectedCategory,
        condition: selectedCondition,
        min_price: minPrice,
        max_price: maxPrice,
        ordering: sortBy,
      };
      
      const data = await marketplaceApi.getListings(params);
      if (data && data.results !== undefined) {
        setListings(data.results || []);
        setTotal(data.count || 0);
      } else {
        setListings(Array.isArray(data) ? data : []);
        setTotal(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Could not fetch marketplace listings. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [page, debouncedSearch, selectedCategory, selectedCondition, minPrice, maxPrice, sortBy]);

  // Save product handler
  const handleSaveProduct = async (e, listingId) => {
    e.stopPropagation(); // prevent card click navigation
    const targetItem = listings.find((l) => l.id === listingId);
    if (!targetItem) return;

    const wasSaved = targetItem.is_saved;
    try {
      if (wasSaved) {
        await marketplaceApi.unsaveProduct(listingId);
        toast.success('Listing removed from wishlist');
      } else {
        await marketplaceApi.saveProduct(listingId);
        toast.success('Listing saved to wishlist!');
      }
      // Optimistically update listings state
      setListings((prev) =>
        prev.map((item) =>
          item.id === listingId ? { ...item, is_saved: !wasSaved } : item
        )
      );
    } catch (err) {
      toast.error(wasSaved ? 'Could not remove listing.' : 'Could not save listing.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Marketplace</h1>
          <p className="mt-2 text-sm text-gray-650">
            Buy and sell goods directly with fellow BHEL colleagues. Verify details via internal chat.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Filter Toggles */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="-created_at">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-views">Most Viewed</option>
          </select>
        </div>
      </div>

      {/* Expandable Filter Section */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-55/50 border border-gray-200 rounded-xl p-4 mb-6">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Condition</label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
            >
              <option value="">Any Condition</option>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Min Price (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Max Price (₹)</label>
            <input
              type="number"
              placeholder="1000000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
            />
          </div>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchListings} />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No listings found"
          message="We couldn't find any listings matching your active filters. Try resetting them!"
          actionLabel="Reset Search"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('');
            setSelectedCondition('');
            setMinPrice('');
            setMaxPrice('');
            setSortBy('-created_at');
            setPage(1);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/marketplace/${item.id}`)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer hover:-translate-y-0.5"
              >
                {/* Product Image */}
                <div className="h-44 bg-gray-100 relative">
                  {item.images?.length > 0 ? (
                    <img
                      src={item.images[0].image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Photo
                    </div>
                  )}
                  {/* Condition Badge */}
                  <span className="absolute bottom-2 left-2 bg-[#003366] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm">
                    {item.condition.replace('_', ' ')}
                  </span>
                  
                  {/* Save button */}
                  <button
                    onClick={(e) => handleSaveProduct(e, item.id)}
                    className={`absolute top-2 right-2 p-1.5 bg-white rounded-full shadow transition-colors cursor-pointer ${
                      item.is_saved 
                        ? 'text-red-500 hover:text-red-650' 
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                    title={item.is_saved ? 'Remove from wishlist' : 'Save to wishlist'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${item.is_saved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className="font-bold text-gray-900 line-clamp-1 flex-1">
                        {item.title}
                      </h3>
                    </div>
                    <div className="text-sm font-black text-[#003366] mb-2">
                      {formatCurrency(item.price)}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-[11px] text-gray-450 font-medium">
                    <span className="truncate max-w-[100px]">{item.seller_name}</span>
                    <span>{item.seller_department}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {total > 12 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-6 mt-8 gap-4">
              <div className="text-sm text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-800">{Math.min((page - 1) * 12 + 1, total)}</span> to{' '}
                <span className="font-bold text-gray-800">{Math.min(page * 12, total)}</span> of{' '}
                <span className="font-bold text-gray-800">{total}</span> listings
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className={`flex items-center gap-1 px-4 py-2 border rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    page === 1
                      ? 'border-gray-200 text-gray-300 bg-gray-55 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:shadow-sm active:scale-95'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="hidden sm:flex items-center gap-1.5">
                  {Array.from({ length: Math.ceil(total / 12) }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === Math.ceil(total / 12) ||
                      Math.abs(pageNum - page) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                            page === pageNum
                              ? 'bg-[#003366] text-white shadow-md shadow-blue-900/10'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      (pageNum === 2 && page > 3) ||
                      (pageNum === Math.ceil(total / 12) - 1 && page < Math.ceil(total / 12) - 2)
                    ) {
                      return (
                        <span key={pageNum} className="px-1 text-gray-400 font-bold">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, Math.ceil(total / 12)))}
                  disabled={page === Math.ceil(total / 12)}
                  className={`flex items-center gap-1 px-4 py-2 border rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    page === Math.ceil(total / 12)
                      ? 'border-gray-200 text-gray-300 bg-gray-55 cursor-not-allowed'
                      : 'border-gray-350 text-gray-700 bg-white hover:bg-gray-50 hover:shadow-sm active:scale-95'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarketplacePage;
