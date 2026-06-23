import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { Toaster } from 'react-hot-toast';

// Lazy load page components for route-based chunking
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CampaignListPage = lazy(() => import('./pages/smartbuy/CampaignListPage'));
const CampaignDetailPage = lazy(() => import('./pages/smartbuy/CampaignDetailPage'));
const CashfreeReturnPage = lazy(() => import('./pages/payments/CashfreeReturnPage'));
const MarketplacePage = lazy(() => import('./pages/marketplace/MarketplacePage'));
const ProductDetailPage = lazy(() => import('./pages/marketplace/ProductDetailPage'));
const SellProductPage = lazy(() => import('./pages/marketplace/SellProductPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CampaignManagement = lazy(() => import('./pages/admin/CampaignManagement'));
const ListingModeration = lazy(() => import('./pages/admin/ListingModeration'));
const PaymentApprovals = lazy(() => import('./pages/admin/PaymentApprovals'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const VendorManagement = lazy(() => import('./pages/admin/VendorManagement'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          {/* Toast notifications container */}
          <Toaster position="top-right" reverseOrder={false} />
          
          {/* Navigation Bar */}
          <Navbar />

          {/* Page Routing */}
          <main className="flex-1">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="large" />
              </div>
            }>
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/smartbuy"
                  element={
                    <ProtectedRoute>
                      <CampaignListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/smartbuy/:id"
                  element={
                    <ProtectedRoute>
                      <CampaignDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments/cashfree-return"
                  element={
                    <ProtectedRoute>
                      <CashfreeReturnPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/marketplace"
                  element={
                    <ProtectedRoute>
                      <MarketplacePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/marketplace/:id"
                  element={
                    <ProtectedRoute>
                      <ProductDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/marketplace/sell"
                  element={
                    <ProtectedRoute>
                      <SellProductPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/campaigns"
                  element={
                    <AdminRoute>
                      <CampaignManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/listings"
                  element={
                    <AdminRoute>
                      <ListingModeration />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/payments"
                  element={
                    <AdminRoute>
                      <PaymentApprovals />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <UserManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/vendors"
                  element={
                    <AdminRoute>
                      <VendorManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <AdminRoute>
                      <ReportsPage />
                    </AdminRoute>
                  }
                />

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
