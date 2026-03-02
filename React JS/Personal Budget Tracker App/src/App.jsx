import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleGuard from './auth/RoleGuard';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Transfers from './pages/Transfers';
import RecurringTransactions from './pages/RecurringTransactions';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import './App.css';

const AppRoutes = () => {

    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={
                    isAuthenticated()
                        ? <Navigate to="/" replace />
                        : <Login />
                }
            />
            <Route
                path="/register"
                element={
                    isAuthenticated()
                        ? <Navigate to="/" replace />
                        : <Register />
                }
            />

            {/* Protected Routes */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_DASHBOARD">
                                <Dashboard />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_ADMIN_DASHBOARD">
                                <AdminDashboard />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/users"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="MANAGE_USERS">
                                <UserManagement />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Accounts */}
            <Route
                path="/accounts"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_ACCOUNTS">
                                <Accounts />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Income */}
            <Route
                path="/income"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_INCOME">
                                <Income />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Expenses */}
            <Route
                path="/expenses"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_EXPENSES">
                                <Expenses />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Budgets */}
            <Route
                path="/budgets"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_BUDGETS">
                                <Budgets />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Goals */}
            <Route
                path="/goals"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_GOALS">
                                <Goals />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Transfers */}
            <Route
                path="/transfers"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_TRANSFERS">
                                <Transfers />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Recurring */}
            <Route
                path="/recurring"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_RECURRING">
                                <RecurringTransactions />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Categories */}
            <Route
                path="/categories"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_CATEGORIES">
                                <Categories />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Alerts */}
            <Route
                path="/alerts"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_ALERTS">
                                <Alerts />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Reports */}
            <Route
                path="/reports"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RoleGuard permission="VIEW_REPORTS">
                                <Reports />
                            </RoleGuard>
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Catch all */}
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