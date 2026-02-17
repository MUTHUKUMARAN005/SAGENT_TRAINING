import React, { useState, useEffect } from 'react';
import { reportAPI } from '../api/axiosConfig';

const Reports = ({ userId }) => {
    const [reports, setReports] = useState([]);

    useEffect(() => { loadReports(); }, [userId]);

    const loadReports = async () => {
        try {
            const res = await reportAPI.getByUser(userId);
            setReports(res.data);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this report?')) {
            await reportAPI.delete(id);
            loadReports();
        }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3>📈 Reports</h3>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Report ID</th>
                            <th>Type</th>
                            <th>Generated At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report) => (
                            <tr key={report.reportId}>
                                <td>#{report.reportId}</td>
                                <td>
                                    <span className="status-badge active">
                                        {report.reportType}
                                    </span>
                                </td>
                                <td>
                                    {new Date(
                                        report.generatedAt
                                    ).toLocaleString()}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                            handleDelete(report.reportId)
                                        }
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {reports.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📈</div>
                        <p>No reports generated yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;