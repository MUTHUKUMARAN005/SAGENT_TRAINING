import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { PERMISSIONS } from './config/permissions';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Applications from './pages/Applications';
import Colleges from './pages/Colleges';
import Courses from './pages/Courses';
import Departments from './pages/Departments';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';
import Documents from './pages/Documents';
import Officers from './pages/Officers';
import AcademicRecords from './pages/AcademicRecords';
import UserManagement from './pages/UserManagement';
import './App.css';

const AppLayout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.DASHBOARD_VIEW}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/students" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.STUDENT_VIEW}>
                  <Students />
                </ProtectedRoute>
              } />
              <Route path="/applications" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.APPLICATION_VIEW}>
                  <Applications />
                </ProtectedRoute>
              } />
              <Route path="/colleges" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.COLLEGE_VIEW}>
                  <Colleges />
                </ProtectedRoute>
              } />
              <Route path="/courses" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.COURSE_VIEW}>
                  <Courses />
                </ProtectedRoute>
              } />
              <Route path="/departments" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.DEPARTMENT_VIEW}>
                  <Departments />
                </ProtectedRoute>
              } />
              <Route path="/payments" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.PAYMENT_VIEW}>
                  <Payments />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.NOTIFICATION_VIEW}>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.DOCUMENT_VIEW}>
                  <Documents />
                </ProtectedRoute>
              } />
              <Route path="/officers" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.OFFICER_VIEW}>
                  <Officers />
                </ProtectedRoute>
              } />
              <Route path="/academic-records" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.RECORD_VIEW}>
                  <AcademicRecords />
                </ProtectedRoute>
              } />
              <Route path="/user-management" element={
                <ProtectedRoute requiredPermission={PERMISSIONS.USER_MANAGE}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop closeOnClick rtl={false}
          pauseOnFocusLoss draggable pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </Router>
  );
}

export default App;