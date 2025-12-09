import React, { useEffect, useState } from 'react';
import { getStudentLibraryProfile } from '../../services/api';

const LibraryProfileView = ({ studentId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        getStudentLibraryProfile(studentId)
            .then(res => setData(res.data.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [studentId]);

    if (loading) return <div>Loading Library Profile...</div>;
    if (!data) return <div>No data available.</div>;

    const { activeLoans, fines, auditLogs } = data;

    return (
        <div className="library-profile-view">
            {/* Active Loans */}
            <h4 className="section-subtitle">Active Loans ({activeLoans.length})</h4>
            {activeLoans.length === 0 ? <p className="text-muted">No active loans.</p> : (
                <table className="data-table">
                    <thead><tr><th>Book</th><th>Due</th><th>Status</th></tr></thead>
                    <tbody>
                        {activeLoans.map(loan => (
                            <tr key={loan.id}>
                                <td>{loan.book?.title}</td>
                                <td>{new Date(loan.dueDate).toLocaleDateString()}</td>
                                <td><span className="badge badge-warning">Issued</span></td>
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
