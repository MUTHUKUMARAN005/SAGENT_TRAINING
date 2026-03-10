import React, { useState, useEffect, useCallback } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { dashboardAPI, incomeAPI, expenseAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

const COLORS = ['#1a237e', '#c62828', '#2e7d32', '#ef6c00', '#6a1b9a', '#00838f', '#455a64'];

const toDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (monthKey) => new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${monthKey}-01`));

const Dashboard = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const currencyPreference = currentUser?.currencyPreference || 'INR';
    const currencySymbol = getCurrencySymbol(currencyPreference);
    const fmt = (value) => formatCurrency(value, currencyPreference);

    const [dashboardData, setDashboardData] = useState(null);
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!userId) {
            setDashboardData(null);
            setIncomes([]);
            setExpenses([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [dashboardRes, incomeRes, expenseRes] = await Promise.all([
                dashboardAPI.get(userId),
                incomeAPI.getByUser(userId),
                expenseAPI.getByUser(userId)
            ]);
            setDashboardData(dashboardRes.data);
            setIncomes(incomeRes.data || []);
            setExpenses(expenseRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="card"><div className="loading-content">⏳ Loading dashboard...</div></div>;
    if (!dashboardData) return <div className="card"><div className="error-content">❌ Failed to load</div></div>;

    const now = new Date();
    const currentMonthKey = getMonthKey(now);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthKey = getMonthKey(previousMonthDate);

    const monthlyIncome = incomes
        .filter((item) => {
            const date = toDate(item.dateReceived);
            return date && getMonthKey(date) === currentMonthKey;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const monthlyExpense = expenses
        .filter((item) => {
            const date = toDate(item.dateSpent);
            return date && getMonthKey(date) === currentMonthKey;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const previousMonthExpense = expenses
        .filter((item) => {
            const date = toDate(item.dateSpent);
            return date && getMonthKey(date) === previousMonthKey;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const remainingBalance = Number(dashboardData.totalIncome || 0) - Number(dashboardData.totalExpense || 0);
    const spendingTrendPercent = previousMonthExpense > 0
        ? ((monthlyExpense - previousMonthExpense) / previousMonthExpense) * 100
        : monthlyExpense > 0 ? 100 : 0;

    const chartData = [
        { name: 'Income', amount: Number(dashboardData.totalIncome) || 0 },
        { name: 'Expense', amount: Number(dashboardData.totalExpense) || 0 },
        { name: 'Remaining', amount: remainingBalance }
    ];

    const expensePieDataMap = expenses.reduce((acc, item) => {
        const key = item.category?.categoryName || 'Others';
        if (!acc[key]) acc[key] = { category: key, total: 0 };
        acc[key].total += Number(item.amount || 0);
        return acc;
    }, {});
    const expensePieData = Object.values(expensePieDataMap).sort((a, b) => b.total - a.total).slice(0, 8);

    const monthKeys = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        return getMonthKey(date);
    });

    const monthlyBarData = monthKeys.map((key) => {
        const income = incomes
            .filter((item) => {
                const date = toDate(item.dateReceived);
                return date && getMonthKey(date) === key;
            })
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const expense = expenses
            .filter((item) => {
                const date = toDate(item.dateSpent);
                return date && getMonthKey(date) === key;
            })
            .reduce((sum, item) => sum + Number(item.amount || 0), 0);
        return {
            month: monthLabel(key),
            income,
            expense
        };
    });

    return (
        <div>
            <div className="page-title">
                <h2>Welcome, {currentUser?.name}! 👋</h2>
                <span className={`role-badge role-${currentUser?.role?.toLowerCase()}`}>{currentUser?.role}</span>
            </div>

            <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon income">💰</div>
                    <div className="stat-info"><h4>Total Income</h4><p className="amount-positive">{fmt(dashboardData.totalIncome)}</p></div></div>
                <div className="stat-card"><div className="stat-icon expense">💸</div>
                    <div className="stat-info"><h4>Total Expense</h4><p className="amount-negative">{fmt(dashboardData.totalExpense)}</p></div></div>
                <div className="stat-card"><div className="stat-icon balance">🏦</div>
                    <div className="stat-info"><h4>Remaining Balance</h4><p className={remainingBalance >= 0 ? 'amount-positive' : 'amount-negative'}>{fmt(remainingBalance)}</p></div></div>
                <div className="stat-card"><div className="stat-icon savings">🔔</div>
                    <div className="stat-info"><h4>Unread Alerts</h4><p>{dashboardData.unreadAlerts || 0}</p></div></div>
            </div>

            <div className="card">
                <div className="card-header"><h3>📅 Monthly Summary</h3></div>
                <div className="dashboard-monthly-summary">
                    <div><strong>Monthly report ({monthLabel(currentMonthKey)}):</strong> Income {fmt(monthlyIncome)} | Expense {fmt(monthlyExpense)} | Net {fmt(monthlyIncome - monthlyExpense)}</div>
                    <div><strong>Spending trends:</strong> {spendingTrendPercent >= 0 ? '▲' : '▼'} {Math.abs(spendingTrendPercent).toFixed(1)}% vs last month ({monthLabel(previousMonthKey)})</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="card">
                    <div className="card-header"><h3>📊 Income vs Expense</h3></div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" /><YAxis tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => fmt(v)} /><Legend />
                            <Bar dataKey="amount" name="Amount" radius={[8, 8, 0, 0]}>
                                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <div className="card-header"><h3>🍩 Expense Pie Chart</h3></div>
                    {expensePieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={expensePieData}
                                    dataKey="total"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {expensePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => fmt(v)} /><Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="empty-state"><p>No expense data</p></div>}
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>📊 Monthly Bar Chart</h3></div>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyBarData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => fmt(value)} />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#2e7d32" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="expense" name="Expense" fill="#c62828" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Dashboard;
