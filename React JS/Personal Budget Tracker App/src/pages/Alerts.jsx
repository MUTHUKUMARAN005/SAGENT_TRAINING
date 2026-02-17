import React, { useState, useEffect } from 'react';
import { alertAPI } from '../api/axiosConfig';

const Alerts = ({ userId }) => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => { loadAlerts(); }, [userId]);

    const loadAlerts = async () => {
        try {
            const res = await alertAPI.getByUser(userId);
            setAlerts(res.data);
        } catch (err) { console.error(err); }
    };

    const handleMarkRead = async (id) => {
        try {
            await alertAPI.markRead(id);
            loadAlerts();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        try {
            await alertAPI.delete(id);
            loadAlerts();
        } catch (err) { console.error(err); }
    };

    const getAlertIcon = (type) => {
        const icons = {
            LOW_BALANCE: '⚠️',
            BILL_DUE: '📄',
            GOAL_PROGRESS: '🎯',
            SPENDING_ALERT: '🚨',
            SUBSCRIPTION: '🔔'
        };
        return icons[type] || '📢';
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3>🔔 Alerts & Notifications</h3>
                    <span style={{ color: '#999', fontSize: '0.85rem' }}>
                        {alerts.filter(a => !a.isRead).length} unread
                    </span>
                </div>

                {alerts.map((alert) => (
                    <div
                        key={alert.alertId}
                        className={`alert-item ${
                            !alert.isRead ? 'unread' : ''
                        }`}
                    >
                        <div
                            className={`alert-dot ${
                                alert.isRead ? 'read' : ''
                            }`}
                        />
                        <span style={{ fontSize: '1.5rem' }}>
                            {getAlertIcon(alert.alertType)}
                        </span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                {alert.alertType?.replace(/_/g, ' ')}
                            </div>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>
                                {alert.message}
                            </div>
                            <div style={{
                                color: '#999',
                                fontSize: '0.8rem',
                                marginTop: 4
                            }}>
                                {new Date(alert.createdAt).toLocaleString()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {!alert.isRead && (
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() =>
                                        handleMarkRead(alert.alertId)
                                    }
                                >
                                    ✓ Read
                                </button>
                            )}
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(alert.alertId)}
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}

                {alerts.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🔔</div>
                        <p>No alerts. You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alerts;