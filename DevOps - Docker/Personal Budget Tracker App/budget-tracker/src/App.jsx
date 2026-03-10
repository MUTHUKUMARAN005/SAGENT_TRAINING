import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleGuard from './auth/RoleGuard';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Accounts from './pages/Accounts';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Transfers from './pages/Transfers';
import RecurringTransactions from './pages/RecurringTransactions';
import Categories from './pages/Categories';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import './App.css';

const P = ({ perm, children }) => (
    <ProtectedRoute>
        <Layout>
            <RoleGuard permission={perm}>{children}</RoleGuard>
        </Layout>
    </ProtectedRoute>
);

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={isAuthenticated() ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={isAuthenticated() ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/" element={<P perm="VIEW_DASHBOARD"><Dashboard /></P>} />
            <Route path="/profile" element={<P perm="VIEW_PROFILE"><Profile /></P>} />
            <Route path="/admin/dashboard" element={<P perm="VIEW_ADMIN_DASHBOARD"><AdminDashboard /></P>} />
            <Route path="/admin/users" element={<P perm="MANAGE_USERS"><UserManagement /></P>} />
            <Route path="/accounts" element={<P perm="VIEW_ACCOUNTS"><Accounts /></P>} />
            <Route path="/income" element={<P perm="VIEW_INCOME"><Income /></P>} />
            <Route path="/expenses" element={<P perm="VIEW_EXPENSES"><Expenses /></P>} />
            <Route path="/budgets" element={<P perm="VIEW_BUDGETS"><Budgets /></P>} />
            <Route path="/goals" element={<P perm="VIEW_GOALS"><Goals /></P>} />
            <Route path="/transfers" element={<P perm="VIEW_TRANSFERS"><Transfers /></P>} />
            <Route path="/recurring" element={<P perm="VIEW_RECURRING"><RecurringTransactions /></P>} />
            <Route path="/categories" element={<P perm="VIEW_CATEGORIES"><Categories /></P>} />
            <Route path="/alerts" element={<P perm="VIEW_ALERTS"><Alerts /></P>} />
            <Route path="/reports" element={<P perm="VIEW_REPORTS"><Reports /></P>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
