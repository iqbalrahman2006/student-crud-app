import React, { useState, useEffect } from 'react';
import { getTransactions, returnBook, renewBook } from '../../services/api';

const TransactionHistory = ({ isActiveView }) => {
    const [transactions, setTransactions] = useState([]);
    // const [loading, setLoading] = useState(true); // Unused

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActiveView]);

    const loadData = async () => {
        // setLoading(true);
        try {
            // If active view, get Issued, else get all (or Returned)
            // Ideally backend supports 'all' or no filter
            // For now, let's fetch "Issued" if active, else "Returned" 
            // OR fetch ALL and filter locally to support better history
            const status = isActiveView ? 'Issued' : '';
            const res = await getTransactions(status);
            setTransactions(res.data.data || []);
        } catch (e) {
            console.error("Load failed");
        } finally {
            // setLoading(false);
        }
    };

    const handleReturn = async (txnId) => {
        if (!window.confirm("Confirm return?")) return;
        try {
            await returnBook({ transactionId: txnId });
            loadData();
        } catch (e) {
            alert("Return Failed");
        }
    };

    const handleRenew = async (txnId) => {
        try {
            await renewBook({ transactionId: txnId });
            alert("Renewed for 7 days!");
            loadData();
        } catch (e) {
            alert("Renew Failed: " + (e.response?.data?.message || e.message));
        }
    };

    const downloadCSV = () => {
        const headers = ["ID,Book,Student,Issue Date,Due Date,Return Date,Status,Fines\n"];
        const rows = transactions.map(t => {
            return [
                t._id,
                `"${t.book?.title || 'Unknown'}"`,
                `"${t.student?.name || 'Unknown'}"`,
                new Date(t.issueDate).toLocaleDateString(),
                new Date(t.dueDate).toLocaleDateString(),
                t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '-',
                t.status,
                t.fine || 0
            ].join(",");
        });

        const blob = new Blob([headers + rows.join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `library_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="transaction-history fade-in">
            {!isActiveView && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                    <button className="button button-edit" onClick={downloadCSV}>📥 Export CSV</button>
                </div>
            )}

            <div className="table-card">
                <table className="student-table sticky-header">
                    <thead>
                        <tr>
                            <th>Book Title</th>
                            <th>Student</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Fines</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(transactions || []).map(t => {
                            const isOverdue = t.status === 'Issued' && new Date() > new Date(t.dueDate);
                            const isDueToday = t.status === 'Issued' && new Date().toDateString() === new Date(t.dueDate).toDateString();

                            let rowStyle = {};
                            if (isOverdue) rowStyle = { backgroundColor: '#fef2f2' }; // Red Tint
                            else if (isDueToday) rowStyle = { backgroundColor: '#fffbeb' }; // Yellow Tint

                            return (
                                <tr key={t._id} style={rowStyle}>
                                    <td style={{ fontWeight: 600 }}>{t.book?.title || "Unknown Book"}</td>
                                    <td>
                                        <div>{t.student?.name || "Unknown"}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.student?.email}</div>
                                    </td>
                                    <td>{new Date(t.issueDate).toLocaleDateString()}</td>
                                    <td style={isOverdue ? { color: '#ef4444', fontWeight: 'bold' } : {}}>
                                        {new Date(t.dueDate).toLocaleDateString()}
                                        {isOverdue && <span style={{ fontSize: '0.7rem', display: 'block' }}>⚠ OVERDUE</span>}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${t.status === 'Issued' ? 'status-graduated' : t.status === 'Returned' ? 'status-active' : 'status-suspended'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td style={{ color: t.fine > 0 ? '#ef4444' : 'inherit', fontWeight: t.fine > 0 ? 700 : 400 }}>
                                        {t.fine ? `$${t.fine}` : '-'}
                                    </td>
                                    <td>
                                        {t.status === 'Issued' && (
                                            <div className="action-buttons">
                                                <button className="button button-submit" onClick={() => handleReturn(t._id)}>Return</button>
                                                <button className="button button-edit" onClick={() => handleRenew(t._id)}>Renew</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No transactions found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionHistory;
