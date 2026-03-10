import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { alertAPI, budgetAPI, expenseAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';

const VIRTUAL_READ_KEY = 'budgetTracker.virtualAlerts.read';
const VIRTUAL_DISMISSED_KEY = 'budgetTracker.virtualAlerts.dismissed';

const safeParseArray = (value) => {
    try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const toDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
};

const Alerts = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const canManage = usePermission('MANAGE_ALERTS');

    const [serverAlerts, setServerAlerts] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [readVirtualIds, setReadVirtualIds] = useState([]);
    const [dismissedVirtualIds, setDismissedVirtualIds] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const readIds = safeParseArray(localStorage.getItem(`${VIRTUAL_READ_KEY}.${userId}`));
        const dismissedIds = safeParseArray(localStorage.getItem(`${VIRTUAL_DISMISSED_KEY}.${userId}`));
        setReadVirtualIds(readIds);
        setDismissedVirtualIds(dismissedIds);
    }, [userId]);

    useEffect(() => {
        localStorage.setItem(`${VIRTUAL_READ_KEY}.${userId}`, JSON.stringify(readVirtualIds));
    }, [readVirtualIds, userId]);

    useEffect(() => {
        localStorage.setItem(`${VIRTUAL_DISMISSED_KEY}.${userId}`, JSON.stringify(dismissedVirtualIds));
    }, [dismissedVirtualIds, userId]);

    const load = useCallback(async () => {
        if (!userId) {
            setServerAlerts([]);
            setBudgets([]);
            setExpenses([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [alertRes, budgetRes, expenseRes] = await Promise.all([
                alertAPI.getByUser(userId),
                budgetAPI.getByUser(userId),
                expenseAPI.getByUser(userId)
            ]);
            setServerAlerts(alertRes.data || []);
            setBudgets(budgetRes.data || []);
            setExpenses(expenseRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    const generatedAlerts = useMemo(() => {
        const now = new Date();
        const monthKey = getMonthKey(now);

        const monthlyExpenseByCategory = expenses.reduce((acc, item) => {
            const date = toDate(item.dateSpent);
            if (!date || getMonthKey(date) !== monthKey) return acc;
            const categoryId = item.category?.categoryId;
            if (!categoryId) return acc;
            acc[categoryId] = (acc[categoryId] || 0) + Number(item.amount || 0);
            return acc;
        }, {});

        const alerts = [];
        budgets.forEach((budget) => {
            if (!String(budget.monthYear || '').startsWith(monthKey)) return;
            const limit = Number(budget.amountLimit || 0);
            if (limit <= 0) return;

            const categoryId = budget.category?.categoryId;
            const categoryName = budget.category?.categoryName || 'Category';
            const spentByExpenses = categoryId ? Number(monthlyExpenseByCategory[categoryId] || 0) : 0;
            const spent = Math.max(Number(budget.amountSpent || 0), spentByExpenses);
            const usagePercent = (spent / limit) * 100;

            if (usagePercent >= 100) {
                alerts.push({
                    alertId: `virtual-overspending-${budget.budgetId}`,
                    alertType: 'OVERSPENDING',
                    message: `${categoryName} budget is over the limit. Spent ${spent.toFixed(2)} against limit ${limit.toFixed(2)}.`,
                    isRead: false,
                    isVirtual: true,
                    createdAt: now.toISOString()
                });
            } else if (usagePercent >= 80) {
                alerts.push({
                    alertId: `virtual-budget-limit-${budget.budgetId}`,
                    alertType: 'BUDGET_LIMIT',
                    message: `${categoryName} budget usage reached ${usagePercent.toFixed(1)}%. Current spend ${spent.toFixed(2)} of ${limit.toFixed(2)}.`,
                    isRead: false,
                    isVirtual: true,
                    createdAt: now.toISOString()
                });
            }
        });

        if (now.getDate() >= 25 || now.getDate() <= 3) {
            const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);
            alerts.push({
                alertId: `virtual-monthly-reminder-${monthKey}`,
                alertType: 'MONTHLY_REMINDER',
                message: `Monthly reminder for ${monthName}: review your budget, recurring bills, and savings targets.`,
                isRead: false,
                isVirtual: true,
                createdAt: now.toISOString()
            });
        }

        return alerts
            .filter((item) => !dismissedVirtualIds.includes(item.alertId))
            .map((item) => ({ ...item, isRead: readVirtualIds.includes(item.alertId) }));
    }, [budgets, expenses, readVirtualIds, dismissedVirtualIds]);

    const allAlerts = useMemo(() => {
        const combined = [
            ...(serverAlerts || []).map((item) => ({ ...item, isVirtual: false })),
            ...generatedAlerts
        ];
        return combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [serverAlerts, generatedAlerts]);

    const markRead = async (alert) => {
        if (!canManage || alert.isRead) return;
        if (alert.isVirtual) {
            setReadVirtualIds((prev) => prev.includes(alert.alertId) ? prev : [...prev, alert.alertId]);
            return;
        }
        await alertAPI.markRead(alert.alertId);
        load();
    };

    const del = async (alert) => {
        if (!canManage) return;
        if (alert.isVirtual) {
            setDismissedVirtualIds((prev) => prev.includes(alert.alertId) ? prev : [...prev, alert.alertId]);
            return;
        }
        await alertAPI.delete(alert.alertId);
        load();
    };

    const markAllRead = async () => {
        if (!canManage) return;
        const unreadAlerts = allAlerts.filter((item) => !item.isRead);
        const unreadVirtual = unreadAlerts.filter((item) => item.isVirtual).map((item) => item.alertId);
        if (unreadVirtual.length > 0) {
            setReadVirtualIds((prev) => Array.from(new Set([...prev, ...unreadVirtual])));
        }
        const unreadServer = unreadAlerts.filter((item) => !item.isVirtual);
        if (unreadServer.length > 0) {
            await Promise.all(unreadServer.map((item) => alertAPI.markRead(item.alertId)));
            load();
        }
    };

    const icon = (type) => ({
        BUDGET_LIMIT: '⚠️',
        OVERSPENDING: '🚨',
        MONTHLY_REMINDER: '🗓️',
        LOW_BALANCE: '⚠️',
        BILL_DUE: '📄',
        GOAL_PROGRESS: '🎯',
        SPENDING_ALERT: '🚨',
        SUBSCRIPTION: '🔔'
    }[type] || '📢');

    const statusFiltered = statusFilter === 'ALL'
        ? allAlerts
        : statusFilter === 'UNREAD'
            ? allAlerts.filter((item) => !item.isRead)
            : allAlerts.filter((item) => item.isRead);

    const filtered = typeFilter === 'ALL'
        ? statusFiltered
        : statusFiltered.filter((item) => item.alertType === typeFilter);

    const unread = allAlerts.filter((item) => !item.isRead).length;
    const virtualCount = allAlerts.filter((item) => item.isVirtual).length;

    if (loading) return <div className="card"><div className="loading-content">⏳ Loading alerts...</div></div>;

    return (
        <div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card"><div className="stat-icon expense">🔔</div><div className="stat-info"><h4>Total Alerts</h4><p>{allAlerts.length}</p></div></div>
                <div className="stat-card"><div className="stat-icon balance">📬</div><div className="stat-info"><h4>Unread</h4><p>{unread}</p></div></div>
                <div className="stat-card"><div className="stat-icon savings">🤖</div><div className="stat-info"><h4>Auto Alerts</h4><p>{virtualCount}</p></div></div>
            </div>

            <div className="card">
                <div className="card-header"><h3>🔔 Notifications</h3>
                    <div className="alerts-controls">
                        <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="ALL">All</option><option value="UNREAD">Unread</option><option value="READ">Read</option>
                        </select>
                        <select className="form-control" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="ALL">All Types</option>
                            <option value="BUDGET_LIMIT">Budget limit alert</option>
                            <option value="OVERSPENDING">Overspending alert</option>
                            <option value="MONTHLY_REMINDER">Monthly reminder</option>
                        </select>
                        {canManage && unread > 0 && <button className="btn btn-success btn-sm" onClick={markAllRead}>✓ All Read</button>}
                    </div>
                </div>
                {filtered.length > 0 ? filtered.map((alert) => (
                    <div key={alert.alertId} className={`alert-item ${!alert.isRead ? 'unread' : ''}`}>
                        <div className={`alert-dot ${alert.isRead ? 'read' : ''}`} />
                        <span style={{ fontSize: '1.5rem' }}>{icon(alert.alertType)}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                {alert.alertType?.replace(/_/g, ' ')}
                                {alert.isVirtual && <span className="type-badge" style={{ marginLeft: 8 }}>Auto</span>}
                            </div>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>{alert.message}</div>
                            <div style={{ color: '#999', fontSize: '0.8rem', marginTop: 4 }}>{new Date(alert.createdAt).toLocaleString()}</div>
                        </div>
                        {canManage && <div style={{ display: 'flex', gap: 8 }}>
                            {!alert.isRead && <button className="btn btn-success btn-sm" onClick={() => markRead(alert)}>✓</button>}
                            <button className="btn btn-danger btn-sm" onClick={() => del(alert)}>🗑️</button>
                        </div>}
                    </div>
                )) : <div className="empty-state"><div className="empty-icon">🔔</div><p>No alerts</p></div>}
            </div>
        </div>
    );
};

export default Alerts;
