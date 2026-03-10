import React, { useState, useEffect, useCallback } from 'react';
import { reportAPI, incomeAPI, expenseAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';
import { formatCurrency } from '../utils/currency';

const toDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const Reports = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const currencyPreference = currentUser?.currencyPreference || 'INR';
    const canGenerate = usePermission('GENERATE_REPORT');
    const canDelete = usePermission('DELETE_REPORT');

    const [reports, setReports] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [reportType, setReportType] = useState('MONTHLY');
    const [monthValue, setMonthValue] = useState(new Date().toISOString().slice(0, 7));
    const [yearValue, setYearValue] = useState(String(new Date().getFullYear()));
    const [generatedReport, setGeneratedReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!userId) {
            setReports([]);
            setIncomes([]);
            setExpenses([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [reportRes, incomeRes, expenseRes] = await Promise.all([
                reportAPI.getByUser(userId),
                incomeAPI.getByUser(userId),
                expenseAPI.getByUser(userId)
            ]);
            setReports(reportRes.data || []);
            setIncomes(incomeRes.data || []);
            setExpenses(expenseRes.data || []);
        } catch (e) {
            console.error(e);
            setError('Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    const buildReport = () => {
        const selectedYear = Number(yearValue);
        const selectedMonthKey = monthValue;
        const selectedMonthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${selectedMonthKey}-01`));

        const incomeTransactions = incomes.filter((item) => {
            const date = toDate(item.dateReceived);
            if (!date) return false;
            if (reportType === 'MONTHLY') return getMonthKey(date) === selectedMonthKey;
            return date.getFullYear() === selectedYear;
        });

        const expenseTransactions = expenses.filter((item) => {
            const date = toDate(item.dateSpent);
            if (!date) return false;
            if (reportType === 'MONTHLY') return getMonthKey(date) === selectedMonthKey;
            return date.getFullYear() === selectedYear;
        });

        const totalIncome = incomeTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const totalExpense = expenseTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const balance = totalIncome - totalExpense;

        const categoryWiseExpensesMap = expenseTransactions.reduce((acc, item) => {
            const key = item.category?.categoryName || 'Others';
            if (!acc[key]) acc[key] = { category: key, total: 0, records: 0 };
            acc[key].total += Number(item.amount || 0);
            acc[key].records += 1;
            return acc;
        }, {});
        const categoryWiseExpenses = Object.values(categoryWiseExpensesMap).sort((a, b) => b.total - a.total);

        const monthlyBreakdown = reportType === 'YEARLY'
            ? Array.from({ length: 12 }, (_, monthIndex) => {
                const monthDate = new Date(selectedYear, monthIndex, 1);
                const key = getMonthKey(monthDate);
                const monthIncome = incomes
                    .filter((item) => {
                        const date = toDate(item.dateReceived);
                        return date && getMonthKey(date) === key;
                    })
                    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
                const monthExpense = expenses
                    .filter((item) => {
                        const date = toDate(item.dateSpent);
                        return date && getMonthKey(date) === key;
                    })
                    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
                return {
                    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(monthDate),
                    income: monthIncome,
                    expense: monthExpense,
                    net: monthIncome - monthExpense
                };
            })
            : [];

        return {
            reportType,
            periodLabel: reportType === 'MONTHLY' ? selectedMonthLabel : String(selectedYear),
            generatedAt: new Date().toISOString(),
            totalIncome,
            totalExpense,
            balance,
            incomeCount: incomeTransactions.length,
            expenseCount: expenseTransactions.length,
            categoryWiseExpenses,
            monthlyBreakdown
        };
    };

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setError('');
        const report = buildReport();
        setGeneratedReport(report);

        try {
            await reportAPI.create({
                userId,
                reportType: report.reportType,
                periodLabel: report.periodLabel,
                generatedAt: report.generatedAt,
                summary: JSON.stringify({
                    totalIncome: report.totalIncome,
                    totalExpense: report.totalExpense,
                    balance: report.balance
                })
            });
            load();
        } catch (e) {
            console.error(e);
        }
    };

    const del = async (id) => {
        if (!canDelete || !window.confirm('Delete?')) return;
        await reportAPI.delete(id);
        load();
    };

    const downloadPdf = () => {
        if (!generatedReport) return;
        const reportHtml = `
            <html>
                <head>
                    <title>Budget Report - ${generatedReport.periodLabel}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
                        h1 { margin-bottom: 4px; }
                        .meta { color: #666; margin-bottom: 18px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 18px; }
                        .card { border: 1px solid #ddd; border-radius: 10px; padding: 10px; }
                        .card .label { color: #666; font-size: 12px; margin-bottom: 3px; }
                        .card .value { font-size: 16px; font-weight: 700; }
                        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #f5f5f5; }
                    </style>
                </head>
                <body>
                    <h1>${generatedReport.reportType} Report</h1>
                    <div class="meta">Period: ${generatedReport.periodLabel} | Generated: ${new Date(generatedReport.generatedAt).toLocaleString()}</div>
                    <div class="grid">
                        <div class="card"><div class="label">Total Income</div><div class="value">${formatCurrency(generatedReport.totalIncome, currencyPreference)}</div></div>
                        <div class="card"><div class="label">Total Expense</div><div class="value">${formatCurrency(generatedReport.totalExpense, currencyPreference)}</div></div>
                        <div class="card"><div class="label">Balance</div><div class="value">${formatCurrency(generatedReport.balance, currencyPreference)}</div></div>
                    </div>
                    <h3>Category-wise Expenses</h3>
                    <table>
                        <thead><tr><th>Category</th><th>Records</th><th>Amount</th></tr></thead>
                        <tbody>
                            ${generatedReport.categoryWiseExpenses.map((item) => `<tr><td>${item.category}</td><td>${item.records}</td><td>${formatCurrency(item.total, currencyPreference)}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) return;
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 200);
    };

    if (loading) return <div className="card"><div className="loading-content">⏳ Loading reports...</div></div>;

    return (
        <div>
            <div className="card">
                <div className="card-header"><h3>📄 Generate Reports</h3></div>
                {error && <div className="error-message">⚠️ {error}</div>}
                <div className="reports-controls">
                    <select className="form-control" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                        <option value="MONTHLY">Monthly report</option>
                        <option value="YEARLY">Yearly report</option>
                    </select>
                    {reportType === 'MONTHLY'
                        ? <input type="month" className="form-control" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
                        : <input type="number" min="2000" max="2100" className="form-control" value={yearValue} onChange={(e) => setYearValue(e.target.value)} />}
                    {canGenerate && <button className="btn btn-primary" onClick={handleGenerate}>📊 Generate</button>}
                    {generatedReport && <button className="btn btn-success" onClick={downloadPdf}>⬇️ Download PDF</button>}
                </div>
            </div>

            {generatedReport && (
                <div className="card">
                    <div className="card-header"><h3>📈 {generatedReport.reportType} Summary ({generatedReport.periodLabel})</h3></div>
                    <div className="stats-grid" style={{ marginBottom: 12 }}>
                        <div className="stat-card"><div className="stat-icon income">💰</div><div className="stat-info"><h4>Total Income</h4><p className="amount-positive">{formatCurrency(generatedReport.totalIncome, currencyPreference)}</p></div></div>
                        <div className="stat-card"><div className="stat-icon expense">💸</div><div className="stat-info"><h4>Total Expense</h4><p className="amount-negative">{formatCurrency(generatedReport.totalExpense, currencyPreference)}</p></div></div>
                        <div className="stat-card"><div className="stat-icon balance">🏦</div><div className="stat-info"><h4>Balance</h4><p className={generatedReport.balance >= 0 ? 'amount-positive' : 'amount-negative'}>{formatCurrency(generatedReport.balance, currencyPreference)}</p></div></div>
                    </div>

                    <table className="data-table" style={{ marginBottom: 16 }}>
                        <thead><tr><th>Category</th><th>Records</th><th>Amount</th></tr></thead>
                        <tbody>{generatedReport.categoryWiseExpenses.map((item) => (
                            <tr key={item.category}>
                                <td>{item.category}</td>
                                <td>{item.records}</td>
                                <td className="amount-negative">{formatCurrency(item.total, currencyPreference)}</td>
                            </tr>
                        ))}</tbody>
                    </table>

                    {generatedReport.reportType === 'YEARLY' && (
                        <table className="data-table">
                            <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr></thead>
                            <tbody>{generatedReport.monthlyBreakdown.map((item) => (
                                <tr key={item.month}>
                                    <td>{item.month}</td>
                                    <td className="amount-positive">{formatCurrency(item.income, currencyPreference)}</td>
                                    <td className="amount-negative">{formatCurrency(item.expense, currencyPreference)}</td>
                                    <td className={item.net >= 0 ? 'amount-positive' : 'amount-negative'}>{formatCurrency(item.net, currencyPreference)}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    )}
                </div>
            )}

            <div className="card">
                <div className="card-header"><h3>📈 Saved Reports</h3></div>
                {reports.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>ID</th><th>Type</th><th>Generated</th>{canDelete && <th>Actions</th>}</tr></thead>
                        <tbody>{reports.map((report) => (<tr key={report.reportId}>
                            <td>#{report.reportId}</td>
                            <td><span className="status-badge active">{report.reportType}</span></td>
                            <td>{new Date(report.generatedAt).toLocaleString()}</td>
                            {canDelete && <td><button className="btn btn-danger btn-sm" onClick={() => del(report.reportId)}>🗑️</button></td>}
                        </tr>))}</tbody>
                    </table>
                ) : <div className="empty-state"><div className="empty-icon">📈</div><p>No reports</p></div>}
            </div>
        </div>
    );
};

export default Reports;
