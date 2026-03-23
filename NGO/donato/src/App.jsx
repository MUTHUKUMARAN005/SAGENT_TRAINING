import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { getDashboardPathByRole } from './utils/roles';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import ScrollToTop from './components/common/ScrollToTop';
import ChatBot from './components/common/ChatBot';
import ErrorBoundary from './components/common/ErrorBoundary';
import SkipNavigation from './components/common/SkipNavigation';
import ProtectedRoute from './components/common/ProtectedRoute';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import VerifyEmailPage from './components/auth/VerifyEmailPage';

// ============================================
// Lazy-loaded Pages (Code Splitting)
// ============================================
const HomePage = lazy(() => import('./pages/HomePage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const CampaignDetailPage = lazy(() => import('./components/campaigns/CampaignDetail'));
const DonatePage = lazy(() => import('./pages/DonatePage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const ReceiptPage = lazy(() => import('./pages/ReceiptPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PhasePage = lazy(() => import('./pages/PhasePage'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ============================================
// Animated Routes with Page Transitions
// ============================================
const AnimatedRoutes = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isAdminUser = isAuthenticated && user?.role === 'admin';
  const adminDashboardPath = getDashboardPathByRole('admin');
  const protectAdminFromPublicRoutes = (element) =>
    isAdminUser ? <Navigate to={adminDashboardPath} replace /> : element;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ---- Public Routes ---- */}
        <Route path="/" element={protectAdminFromPublicRoutes(<HomePage />)} />
        <Route path="/campaigns" element={protectAdminFromPublicRoutes(<CampaignsPage />)} />
        <Route path="/campaigns/:campaignId" element={protectAdminFromPublicRoutes(<CampaignDetailPage />)} />
        <Route path="/donate" element={protectAdminFromPublicRoutes(<DonatePage />)} />
        <Route path="/donate/:campaignId" element={protectAdminFromPublicRoutes(<DonatePage />)} />
        <Route path="/map" element={protectAdminFromPublicRoutes(<MapPage />)} />
        <Route path="/about" element={protectAdminFromPublicRoutes(<AboutPage />)} />
        <Route path="/contact" element={protectAdminFromPublicRoutes(<ContactPage />)} />
        <Route path="/login" element={protectAdminFromPublicRoutes(<LoginPage />)} />
        <Route path="/register" element={protectAdminFromPublicRoutes(<RegisterPage />)} />
        <Route path="/forgot-password" element={protectAdminFromPublicRoutes(<ForgotPasswordPage />)} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/phase" element={protectAdminFromPublicRoutes(<PhasePage />)} />

        {/* ---- Receipt Routes (public but data-driven) ---- */}
        <Route path="/receipt" element={<ReceiptPage />} />
        <Route path="/receipt/:receiptId" element={<ReceiptPage />} />

        {/* ---- Protected Routes ---- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ---- Admin Only Routes ---- */}
        <Route
          path="/dashboard/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />


        {/* ---- NGO Only Routes ---- */}
        <Route
          path="/dashboard/ngo/*"
          element={
            <ProtectedRoute allowedRoles={['ngo']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ---- Donor Only Routes ---- */}
        <Route
          path="/dashboard/donor/*"
          element={
            <ProtectedRoute allowedRoles={['donor']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ---- Volunteer Only Routes ---- */}
        <Route
          path="/dashboard/volunteer/*"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* ---- 404 Fallback ---- */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

// ============================================
// Main App Component
// ============================================
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen flex flex-col bg-dark-bg relative isolate">
            {/* Accessibility: Skip Navigation */}
            <SkipNavigation />

            {/* App Shell Background */}
            <div
              className="app-shell-backdrop"
              aria-hidden="true"
            >
              <div className="app-shell-grid" />
              <div className="app-shell-glow app-shell-glow-left" />
              <div className="app-shell-glow app-shell-glow-right" />
            </div>

            {/* Scroll Reset on Route Change */}
            <ScrollToTop />

            {/* Top Navigation Bar */}
            <Navbar />

            {/* Main Content Area */}
            <main id="main-content" className="flex-grow relative z-10" role="main">
              <Suspense fallback={<Loader />}>
                <AnimatedRoutes />
              </Suspense>
            </main>

            {/* Site Footer */}
            <Footer />

            {/* Floating ChatBot Widget */}
            <ChatBot />

            {/* Toast Notification System */}
            <Toaster
              position="top-right"
              containerStyle={{ top: 80 }}
              gutter={8}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#10192d',
                  color: '#dbe7ff',
                  border: '1px solid #33445f',
                  borderRadius: '14px',
                  fontSize: '14px',
                  padding: '12px 16px',
                  boxShadow: '0 18px 45px rgba(2,6,23,0.45)',
                  maxWidth: '400px',
                },
                success: {
                  iconTheme: { primary: '#22c55e', secondary: '#fff' },
                  style: {
                    borderLeft: '4px solid #22c55e',
                  },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                  style: {
                    borderLeft: '4px solid #ef4444',
                  },
                },
                loading: {
                  iconTheme: { primary: '#4d77f4', secondary: '#fff' },
                  style: {
                    borderLeft: '4px solid #4d77f4',
                  },
                },
              }}
            />
              </div>
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
