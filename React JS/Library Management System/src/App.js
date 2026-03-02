// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import { RouteGuard } from './auth/RoleGuard';
import { PERMISSIONS } from './auth/permissions';

import Layout from './components/Layout/Layout';
import LoginPage from './components/Auth/LoginPage';
import UnauthorizedPage from './components/Auth/UnauthorizedPage';

import Dashboard from './components/Pages/Dashboard';
import Books from './components/Pages/Books';
import Authors from './components/Pages/Authors';
import Members from './components/Pages/Members';
import Libraries from './components/Pages/Libraries';
import Librarians from './components/Pages/Librarians';
import BookCopies from './components/Pages/BookCopies';
import CatalogEntries from './components/Pages/CatalogEntries';
import BorrowingRecords from './components/Pages/BorrowingRecords';
import Fines from './components/Pages/Fines';
import Requests from './components/Pages/Requests';
import Notifications from './components/Pages/Notifications';
import Profile from './components/Pages/Profile';

const AppRoutes = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Public routes
  if (['/login', '/unauthorized'].includes(location.pathname)) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          } />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </AnimatePresence>
    );
  }

  // Protected routes
  return (
    <ProtectedRoute>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard />} />

            <Route path="/books" element={
              <RouteGuard permission={PERMISSIONS.VIEW_BOOKS}><Books /></RouteGuard>
            } />
            <Route path="/authors" element={
              <RouteGuard permission={PERMISSIONS.VIEW_AUTHORS}><Authors /></RouteGuard>
            } />
            <Route path="/members" element={
              <RouteGuard permission={PERMISSIONS.VIEW_MEMBERS}><Members /></RouteGuard>
            } />
            <Route path="/libraries" element={
              <RouteGuard permission={PERMISSIONS.VIEW_LIBRARIES}><Libraries /></RouteGuard>
            } />
            <Route path="/librarians" element={
              <RouteGuard permission={PERMISSIONS.VIEW_LIBRARIANS}><Librarians /></RouteGuard>
            } />
            <Route path="/book-copies" element={
              <RouteGuard permission={PERMISSIONS.VIEW_BOOK_COPIES}><BookCopies /></RouteGuard>
            } />
            <Route path="/catalog" element={
              <RouteGuard permission={PERMISSIONS.VIEW_CATALOG}><CatalogEntries /></RouteGuard>
            } />
            <Route path="/borrowings" element={
              <RouteGuard permissions={[PERMISSIONS.VIEW_BORROWINGS, PERMISSIONS.VIEW_OWN_BORROWINGS]}>
                <BorrowingRecords />
              </RouteGuard>
            } />
            <Route path="/fines" element={
              <RouteGuard permissions={[PERMISSIONS.VIEW_FINES, PERMISSIONS.VIEW_OWN_FINES]}>
                <Fines />
              </RouteGuard>
            } />
            <Route path="/requests" element={
              <RouteGuard permissions={[PERMISSIONS.VIEW_REQUESTS, PERMISSIONS.VIEW_OWN_REQUESTS]}>
                <Requests />
              </RouteGuard>
            } />
            <Route path="/notifications" element={
              <RouteGuard permissions={[PERMISSIONS.VIEW_NOTIFICATIONS, PERMISSIONS.VIEW_OWN_NOTIFICATIONS]}>
                <Notifications />
              </RouteGuard>
            } />
            <Route path="/profile" element={
              <RouteGuard permission={PERMISSIONS.VIEW_PROFILE}><Profile /></RouteGuard>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;