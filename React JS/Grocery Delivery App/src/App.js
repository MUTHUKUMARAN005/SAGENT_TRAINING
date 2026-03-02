import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './guards/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import CustomerLayout from './layouts/CustomerLayout';
import SellerLayout from './layouts/SellerLayout';
import DeliveryLayout from './layouts/DeliveryLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageStores from './pages/admin/ManageStores';
import ManageProducts from './pages/admin/ManageProducts';
import AllOrders from './pages/admin/AllOrders';
import AdminInventory from './pages/admin/Inventory';
import AdminPayments from './pages/admin/Payments';
import AdminDeliveries from './pages/admin/Deliveries';
import AdminDiscounts from './pages/admin/DiscountRules';
import AdminCancellations from './pages/admin/Cancellations';
import AdminNotifications from './pages/admin/Notifications';

// Customer Pages
import Home from './pages/customer/Home';
import ProductListing from './pages/customer/ProductListing';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import MyOrders from './pages/customer/MyOrders';
import OrderTracking from './pages/customer/OrderTracking';
import Profile from './pages/customer/Profile';
import Wishlist from './pages/customer/Wishlist';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerOrders from './pages/seller/SellerOrders';
import SellerInventory from './pages/seller/SellerInventory';
import SellerAnalytics from './pages/seller/SellerAnalytics';

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import AssignedDeliveries from './pages/delivery/AssignedDeliveries';
import DeliveryHistory from './pages/delivery/DeliveryHistory';
import DeliveryProfile from './pages/delivery/DeliveryProfile';

import './App.css';

const HOME_ROUTES = {
  ADMIN: '/admin',
  SELLER: '/seller',
  CUSTOMER: '/',
  DELIVERY_PARTNER: '/delivery',
};

const isValidRole = (role) => Object.prototype.hasOwnProperty.call(HOME_ROUTES, role);

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* ============ AUTH ROUTES ============ */}
        <Route path="/login" element={
          <Login />
        } />
        <Route path="/register" element={
          isAuthenticated && isValidRole(user?.role)
            ? <Navigate to={getHomeRoute(user?.role)} replace />
            : <Register />
        } />

        {/* ============ CUSTOMER ROUTES (Light Theme) ============ */}
        <Route element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductListing />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/order/:id" element={<OrderTracking />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* ============ ADMIN ROUTES (Dark Theme) ============ */}
        <Route element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/stores" element={<ManageStores />} />
          <Route path="/admin/products" element={<ManageProducts />} />
          <Route path="/admin/orders" element={<AllOrders />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/deliveries" element={<AdminDeliveries />} />
          <Route path="/admin/discounts" element={<AdminDiscounts />} />
          <Route path="/admin/cancellations" element={<AdminCancellations />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
        </Route>

        {/* ============ SELLER ROUTES (Dark Theme) ============ */}
        <Route element={
          <ProtectedRoute allowedRoles={['SELLER']}>
            <SellerLayout />
          </ProtectedRoute>
        }>
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/inventory" element={<SellerInventory />} />
          <Route path="/seller/analytics" element={<SellerAnalytics />} />
        </Route>

        {/* ============ DELIVERY PARTNER ROUTES (Dark Theme) ============ */}
        <Route element={
          <ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}>
            <DeliveryLayout />
          </ProtectedRoute>
        }>
          <Route path="/delivery" element={<DeliveryDashboard />} />
          <Route path="/delivery/assigned" element={<AssignedDeliveries />} />
          <Route path="/delivery/history" element={<DeliveryHistory />} />
          <Route path="/delivery/profile" element={<DeliveryProfile />} />
        </Route>

        {/* ============ CATCH ALL ============ */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AnimatePresence>
  );
};

const getHomeRoute = (role) => {
  return HOME_ROUTES[role] || '/login';
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '16px',
              padding: '16px 24px',
              fontSize: '0.9rem',
              fontWeight: 500,
            },
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
