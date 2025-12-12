import React, { useState, useEffect } from 'react';
import { bookService } from '../../services/bookService';

const LibraryProfileView = ({ studentId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        if (!studentId) return;
        bookService.getStudentProfile(studentId)
            .then(res => setData(res.data.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [studentId, refresh]);

    const handleReturn = async (loanId) => {
        if (!window.confirm("Confirm Return? Fine calculation will apply.")) return;
        try {
            const res = await bookService.return({ transactionId: loanId });
            // Show fine if any
            if (res.data.fineApplied > 0) alert(`Returned! Fine Applied: $${res.data.fineApplied}`);
            else alert("Book Returned Successfully.");
            setRefresh(p => p + 1);
        } catch (e) { alert("Return Failed: " + e.message); }
    };

    const handleRenew = async (loanId) => {
        if (!window.confirm("Renew for 7 days?")) return;
        try {
            await bookService.renew({ transactionId: loanId, days: 7 });
            alert("Book Renewed Successfully.");
            setRefresh(p => p + 1);
        } catch (e) { alert("Renew Failed: " + e.message); }
    };

    if (loading) return <div>Loading Library Profile...</div>;
    if (!data) return <div>No data available.</div>;

    const { activeLoans, fines, auditLogs } = data;

    return (
        <div className="library-profile-view">
            {/* Active Loans */}
            <h4 className="section-subtitle">Active Loans ({activeLoans.length})</h4>
            {activeLoans.length === 0 ? <p className="text-muted">No active loans.</p> : (
                <table className="data-table">
                    <thead><tr><th>Book</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {activeLoans.map(loan => (
                            <tr key={loan._id}>
                                <td>{loan.bookId?.title || 'Unknown Book'}</td>
                                <td>{new Date(loan.dueDate).toLocaleDateString()}</td>
                                <td><span className={`badge badge-${loan.status === 'BORROWED' ? 'warning' : 'success'}`}>{loan.status}</span></td>
                                <td>
                                    <button className="button button-sm button-edit" style={{ marginRight: '5px' }} onClick={() => handleRenew(loan._id)}>Renew</button>
                                    <button className="button button-sm button-delete" onClick={() => handleReturn(loan._id)}>Return</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Fines */}
            <h4 className="section-subtitle" style={{ marginTop: '20px' }}>Fine Ledger</h4>
            {fines.length === 0 ? <p className="text-muted">No fines recorded.</p> : (
                <ul className="fine-list">
                    {fines.map(fine => (
                        <li key={fine.id} style={{ color: fine.status === 'Unpaid' ? 'red' : 'green' }}>
                            ${fine.amount} - {fine.reason} ({fine.status})
                        </li>
                    ))}
                </ul>
            )}

            {/* Audit Log */}
            <h4 className="section-subtitle" style={{ marginTop: '20px' }}>Recent Activity</h4>
            <div className="audit-log-scroller" style={{ maxHeight: '150px', overflowY: 'auto', background: '#f8fafc', padding: '10px' }}>
                {auditLogs.map((log, i) => (
                    <div key={i} style={{ fontSize: '12px', marginBottom: '5px', borderBottom: '1px solid #eee' }}>
                        <strong>{log.action}</strong>: {log.details} <span style={{ color: '#999' }}>{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LibraryProfileView;
