import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ShoppingBag, 
  ShoppingCart, 
  User, 
  LogOut, 
  Shield, 
  Menu, 
  X, 
  ChevronDown,
  List,
  History,
  Bell,
  MessageSquare,
  CreditCard,
  Tag,
  Info
} from 'lucide-react';

import { notificationsApi } from '../api/notifications';
import { adminApi } from '../api/admin';
import { formatDistanceToNow } from 'date-fns';
import bhelLogo from '../assets/BHEL_logo.svg';

const Navbar = () => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State for mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // State for desktop profile dropdown toggle
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  // State for notifications dropdown toggle
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminStats, setAdminStats] = useState(null);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const mobileNotificationsRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const countData = await notificationsApi.getUnreadCount();
      setUnreadCount(countData.unread_count);
      
      const notifsData = await notificationsApi.getNotifications();
      const list = notifsData.results || notifsData;
      setNotifications(Array.isArray(list) ? list : []);
      
      if (isAdmin) {
        const stats = await adminApi.getDashboardMetrics();
        setAdminStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      const clickedOutsideDesktop = !notificationsRef.current || !notificationsRef.current.contains(event.target);
      const clickedOutsideMobile = !mobileNotificationsRef.current || !mobileNotificationsRef.current.contains(event.target);
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on path changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNotificationClick = async (notif) => {
    setNotificationsOpen(false);
    
    if (String(notif.id).startsWith('admin-')) {
      if (notif.link) {
        navigate(notif.link);
      }
      return;
    }
    
    if (!notif.is_read) {
      try {
        await notificationsApi.markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read', err);
      }
    }
    
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const getCombinedNotifications = () => {
    let combined = [];
    if (isAdmin && adminStats) {
      if (adminStats.pending_listings > 0) {
        combined.push({
          id: 'admin-listings',
          title: 'Pending Listings Review',
          message: `There are ${adminStats.pending_listings} listings awaiting moderator review.`,
          notification_type: 'admin_listing',
          link: '/admin/listings',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      if (adminStats.pending_refunds > 0) {
        combined.push({
          id: 'admin-refunds',
          title: 'Pending Refunds',
          message: `There are ${adminStats.pending_refunds} refunds awaiting processing.`,
          notification_type: 'admin_refund',
          link: '/admin/payments',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }
    return [...combined, ...notifications];
  };

  const getDisplayUnreadCount = () => {
    let count = unreadCount;
    if (isAdmin && adminStats) {
      if (adminStats.pending_listings > 0) count += 1;
      if (adminStats.pending_refunds > 0) count += 1;
    }
    return count;
  };

  const getNotificationIcon = (type) => {
    const classes = "w-4 h-4 flex-shrink-0";
    switch (type) {
      case 'chat':
        return <MessageSquare className={`${classes} text-blue-500`} />;
      case 'payment':
        return <CreditCard className={`${classes} text-green-500`} />;
      case 'campaign':
        return <ShoppingCart className={`${classes} text-purple-500`} />;
      case 'listing':
        return <Tag className={`${classes} text-amber-500`} />;
      case 'admin_listing':
      case 'admin_payment':
      case 'admin_refund':
        return <Shield className={`${classes} text-yellow-500`} />;
      default:
        return <Info className={`${classes} text-gray-500`} />;
    }
  };

  const formatTime = (timeStr) => {
    try {
      return formatDistanceToNow(new Date(timeStr), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  /* Render Guard: Hide navbar if user is not logged in */
  if (!isAuthenticated) return null;

  return (
    <nav className="bg-[#003366] text-white shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: Logo & Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-wider hover:text-blue-200 transition-colors">
              <img src={bhelLogo} alt="BHEL Logo" className="h-8 w-auto" />
              <span>BHEL Connect</span>
            </Link>
          </div>

          {/* CENTER: Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/smartbuy"
              className={`flex items-center gap-1.5 hover:text-blue-200 transition-colors text-sm font-semibold py-2 ${
                location.pathname.startsWith('/smartbuy') ? 'text-blue-200 border-b-2 border-white' : ''
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              SmartBuy
            </Link>

            <Link
              to="/marketplace"
              className={`flex items-center gap-1.5 hover:text-blue-200 transition-colors text-sm font-semibold py-2 ${
                location.pathname === '/marketplace' ? 'text-blue-200 border-b-2 border-white' : ''
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Marketplace
            </Link>

            <Link
              to="/marketplace/sell"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              Sell Product
            </Link>

            {/* CONDITIONAL RENDER: Show Admin Dashboard link in center nav only if user is admin employee */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-semibold py-2 ${
                  location.pathname.startsWith('/admin') ? 'text-yellow-300 border-b-2 border-yellow-400' : ''
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* RIGHT: Notifications & Profile Dropdown (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full text-blue-100 hover:text-white hover:bg-[#002244] border border-transparent hover:border-blue-900/50 transition-all cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {getDisplayUnreadCount() > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#003366]">
                    {getDisplayUnreadCount()}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white text-gray-800 shadow-xl border border-gray-150 py-1.5 focus:outline-none z-50 transform origin-top-right">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <span className="text-sm font-extrabold text-[#003366]">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {getCombinedNotifications().length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-400 font-medium">
                        No notifications yet
                      </div>
                    ) : (
                      getCombinedNotifications().map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer select-none ${
                            !notif.is_read ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {getNotificationIcon(notif.notification_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className={`text-xs font-bold text-gray-800 truncate ${!notif.is_read ? 'font-extrabold text-blue-900' : ''}`}>
                                {notif.title}
                              </p>
                              {notif.created_at && (
                                <span className="text-[9px] text-gray-400 font-semibold ml-2 flex-shrink-0">
                                  {formatTime(notif.created_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-normal break-words">
                              {notif.message}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 bg-[#002244] hover:bg-[#001122] px-3.5 py-2 rounded-xl border border-blue-900/50 transition-all cursor-pointer font-bold text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <span>{user?.name || 'My Account'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile dropdown items */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-gray-800 shadow-xl border border-gray-150 py-1.5 focus:outline-none z-50 transform origin-top-right">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase">Logged in as</p>
                    <p className="text-sm font-extrabold text-[#003366] truncate">{user?.name}</p>
                    <p className="text-[10px] font-semibold text-gray-400 font-mono truncate">{user?.employee_id}</p>
                  </div>
                  
                  <Link
                    to="/profile?tab=info"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    My Profile
                  </Link>

                  <Link
                    to="/profile?tab=listings"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <List className="w-4 h-4 text-gray-400" />
                    My Listings
                  </Link>

                  <Link
                    to="/profile?tab=purchases"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                    My Purchases
                  </Link>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE: Notifications Bell & Menu Hamburger Toggle Button */}
          <div className="md:hidden flex items-center space-x-2">
            
            {/* Mobile Notification Bell */}
            <div className="relative" ref={mobileNotificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full text-blue-100 hover:text-white hover:bg-[#002244] transition-all cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {getDisplayUnreadCount() > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#003366]">
                    {getDisplayUnreadCount()}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white text-gray-800 shadow-xl border border-gray-150 py-1.5 focus:outline-none z-50 transform origin-top-right">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <span className="text-sm font-extrabold text-[#003366]">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {getCombinedNotifications().length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-400 font-medium">
                        No notifications yet
                      </div>
                    ) : (
                      getCombinedNotifications().map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer select-none ${
                            !notif.is_read ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {getNotificationIcon(notif.notification_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className={`text-xs font-bold text-gray-800 truncate ${!notif.is_read ? 'font-extrabold text-blue-900' : ''}`}>
                                {notif.title}
                              </p>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-normal break-words">
                              {notif.message}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-[#002244] hover:text-white focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile responsive drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#002244] border-t border-blue-900/30">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/smartbuy"
              className="block px-3 py-2 rounded-md text-base font-bold hover:bg-[#001122]"
            >
              SmartBuy
            </Link>
            
            <Link
              to="/marketplace"
              className="block px-3 py-2 rounded-md text-base font-bold hover:bg-[#001122]"
            >
              Marketplace
            </Link>

            <Link
              to="/marketplace/sell"
              className="block px-3 py-2 rounded-md text-base font-bold text-blue-300 hover:bg-[#001122]"
            >
              Sell Product
            </Link>

            {/* CONDITIONAL RENDER: Mobile Admin dashboard navigation link */}
            {isAdmin && (
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-md text-base font-bold text-yellow-400 hover:bg-[#001122]"
              >
                Admin Panel
              </Link>
            )}

            <div className="border-t border-blue-950 my-2"></div>

            <Link
              to="/profile?tab=info"
              className="block px-3 py-2 rounded-md text-base font-bold hover:bg-[#001122]"
            >
              My Profile
            </Link>

            <Link
              to="/profile?tab=listings"
              className="block px-3 py-2 rounded-md text-base font-bold hover:bg-[#001122]"
            >
              My Listings
            </Link>

            <Link
              to="/profile?tab=purchases"
              className="block px-3 py-2 rounded-md text-base font-bold hover:bg-[#001122]"
            >
              My Purchases
            </Link>

            <button
              onClick={handleLogout}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-bold text-red-300 hover:bg-red-900/20 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
