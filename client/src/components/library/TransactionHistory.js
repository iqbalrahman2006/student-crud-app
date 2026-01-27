import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { bookService } from '../../services/bookService';
import ActionGuard from '../../utils/ActionGuard';
import { Button } from 'semantic-ui-react';

const TransactionHistory = ({ isActiveView }) => {
    const [rawTransactions, setRawTransactions] = useState([]); // Store fetched data
    const [transactions, setTransactions] = useState([]); // Store displayed data
    const [highlightedId, setHighlightedId] = useState(null);
    const [toast, setToast] = useState(null); // Local toast state
    const location = useLocation();

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActiveView, location.search]);

    // SMART SCROLL & HIGHLIGHT LOGIC
    useEffect(() => {
        if (rawTransactions.length === 0) {
            setTransactions([]);
            return;
        }

        const query = new URLSearchParams(location.search);
        const studentId = query.get('student') || query.get('studentId');
        const bookId = query.get('bookId');
        const status = query.get('status');

        let filtered = [...rawTransactions];
        let targetTxn = null;

        if (studentId) {
            // 1. Try Exact Match (Book + Student)
            if (bookId) {
                targetTxn = filtered.find(t =>
                    (t.studentId?._id === studentId || t.student?._id === studentId || t.studentId === studentId) &&
                    (t.bookId?._id === bookId || t.book?._id === bookId || t.bookId === bookId)
                );
            }

            // 2. If no exact match (or no bookId), try Best Match by Status
            if (!targetTxn && status) {
                const relevantTxns = filtered.filter(t =>
                    (t.studentId?._id === studentId || t.student?._id === studentId || t.studentId === studentId)
                );

                if (status === 'overdue') {
                    // Find earliest overdue
                    const overdueTxns = relevantTxns.filter(t =>
                        t.status === 'BORROWED' && new Date() > new Date(t.dueDate)
                    );
                    overdueTxns.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                    targetTxn = overdueTxns[0];
                } else if (status === 'active' || status === 'borrowed') {
                    // Find most recent active
                    const activeTxns = relevantTxns.filter(t => t.status === 'BORROWED' || t.status === 'Issued');
                    activeTxns.sort((a, b) => new Date(b.issuedAt || b.issueDate) - new Date(a.issuedAt || a.issueDate));
                    targetTxn = activeTxns[0];
                }
            }
        }

        if (targetTxn) {
            setHighlightedId(targetTxn._id);
            // STRICT MODE: Show ONLY the matching row
            setTransactions([targetTxn]);

            // Delay scroll slightly to ensure render
            setTimeout(() => {
                const el = document.getElementById(`row-${targetTxn._id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);

            // Clear highlight after 2s
            setTimeout(() => setHighlightedId(null), 2000);
        } else {
            // No strict target found, show all raw transactions (already filtered by loadData if studentId was there)
            setTransactions(filtered);

            if (studentId && (bookId || status) && !toast && filtered.length === 0) {
                // Nothing found for this student filter at all
                setToast({ message: "No matching loan found for this student.", type: 'warning' });
                setTimeout(() => setToast(null), 3000);
            }
        }
    }, [rawTransactions, location.search]); // Depend on RAW data

    const loadData = async () => {
        try {
            const status = isActiveView ? 'BORROWED' : 'RETURNED';
            const res = await bookService.getTransactions(status);
            let data = res.data.data || [];

            // FILTER BY STUDENT ID IF PRESENT IN URL (Base Filter)
            const queryParams = new URLSearchParams(location.search);
            const studentId = queryParams.get('student') || queryParams.get('studentId');
            if (studentId) {
                data = data.filter(t => (t.studentId?._id === studentId || t.student?._id === studentId || t.studentId === studentId));
            }

            setRawTransactions(data);
            // We do NOT set 'transactions' here, let the Effect handle it to ensure consistent logic
        } catch (e) {
            console.error("Load failed");
        }
    };

    const handleReturn = async (txnId) => {
        if (!window.confirm("Confirm return?")) return;
        try {
            await bookService.return({ transactionId: txnId });
            loadData();
        } catch (e) {
            alert("Return Failed");
        }
    };

    const handleRenew = async (txnId) => {
        try {
            await bookService.renew({ transactionId: txnId });
            alert("Renewed for 7 days!");
            loadData();
        } catch (e) {
            alert("Renew Failed: " + (e.response?.data?.message || e.message));
        }
    };

    const downloadCSV = () => {
        // LAYER 11: Prevention - fail if any transaction has orphan references
        const orphanTransactions = transactions.filter(t => !t.book || !t.student);
        if (orphanTransactions.length > 0) {
            console.error('ERROR: Orphan transaction records detected:', orphanTransactions);
            this.setState({ toast: { message: 'ERROR: Cannot export - database contains orphan records. Admin must repair.' } });
            return;
        }

        const headers = ["ID,Book,Student,Issue Date,Due Date,Return Date,Status,Fines\n"];
        const rows = transactions.map(t => {
            return [
                t._id,
                `"${t.book.title}"`,
                `"${t.student.name}"`,
                new Date(t.issueDate).toLocaleDateString(),
                new Date(t.dueDate).toLocaleDateString(),
                t.returnDate ? new Date(t.returnDate).toLocaleDateString() : '-',
                t.status,
                t.fineAmount || 0
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
        <div className="transaction-history fade-in" style={{ paddingBottom: '20px' }}>
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#1e293b', color: '#fff', padding: '12px 24px', borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    zIndex: 9999, fontSize: '0.95rem', fontWeight: 600, animation: 'fadeIn 0.3s ease'
                }}>
                    {toast.message}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {(new URLSearchParams(location.search).get('student') || new URLSearchParams(location.search).get('studentId')) && (
                        <div style={{
                            background: '#eff6ff', color: '#1d4ed8', padding: '8px 16px', borderRadius: '12px',
                            fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                            border: '1px solid #dbeafe'
                        }}>
                            👤 Filtered View
                            <button
                                onClick={() => window.location.href = '/library/issued'}
                                style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontSize: '1.1rem', padding: 0, lineHeight: 1 }}
                            >✕</button>
                        </div>
                    )}
                </div>

                <button
                    onClick={downloadCSV}
                    style={{
                        padding: '10px 20px', borderRadius: '12px', border: 'none',
                        background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.9rem',
                        cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    onMouseEnter={e => e.target.style.background = '#f8fafc'}
                    onMouseLeave={e => e.target.style.background = '#ffffff'}
                >
                    📥 Export CSV
                </button>
            </div>

            <div style={{
                background: '#ffffff', borderRadius: '24px', overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #f1f5f9'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Book Title</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issue / Due Date</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fines</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(transactions || []).map(t => {
                            const book = t.bookId || t.book || {};
                            const student = t.studentId || t.student || {};
                            const issueDate = t.issuedAt || t.issueDate;
                            const dueDate = t.dueDate;
                            const isOverdue = t.status === 'BORROWED' && new Date() > new Date(dueDate);
                            const isHighlighted = highlightedId === t._id;

                            return (
                                <tr
                                    key={t._id}
                                    id={`row-${t._id}`}
                                    style={{
                                        borderBottom: '1px solid #f1f5f9',
                                        transition: 'all 0.3s ease',
                                        background: isHighlighted ? '#eff6ff' : (isOverdue ? '#fff1f2' : 'transparent')
                                    }}
                                    className="loan-row"
                                >
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{book.title}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 600, color: '#334155' }}>{student.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{student.email}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>📅 {new Date(issueDate).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isOverdue ? '#ef4444' : '#6366f1' }}>⏳ {new Date(dueDate).toLocaleDateString()}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{
                                            padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                                            background: t.status === 'RETURNED' ? '#dcfce7' : (isOverdue ? '#fee2e2' : '#fef3c7'),
                                            color: t.status === 'RETURNED' ? '#15803d' : (isOverdue ? '#b91c1c' : '#b45309')
                                        }}>
                                            {isOverdue ? 'OVERDUE' : t.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 700, color: t.fineAmount > 0 || isOverdue ? '#ef4444' : '#1e293b' }}>
                                            {t.fineAmount ? `$${t.fineAmount}` : (isOverdue ? 'Pending' : '-')}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        {(t.status === 'BORROWED' || t.status === 'Issued') && (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <ActionGuard actionKey="BOOK_RETURN" handler={() => handleReturn(t._id)} role="ADMIN">
                                                    <button
                                                        style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)' }}
                                                        onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                                                        onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                                                    >⟲ RETURN</button>
                                                </ActionGuard>
                                                <ActionGuard actionKey="BOOK_RENEW" handler={() => handleRenew(t._id)} role="ADMIN">
                                                    <button
                                                        style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }}
                                                        onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                                                        onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                                                    >↻ RENEW</button>
                                                </ActionGuard>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && (
                            <tr><td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem', fontWeight: 500 }}>No active loans found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .loan-row:hover {
                    background-color: #f8fafc !important;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default TransactionHistory;
