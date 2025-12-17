import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { bookService } from '../../services/bookService';
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
        <div className="transaction-history fade-in">
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#333',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '25px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 2000,
                    fontSize: '0.9rem',
                    animation: 'fadeIn 0.3s ease-in-out'
                }}>
                    {toast.message}
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                {(new URLSearchParams(location.search).get('student') || new URLSearchParams(location.search).get('studentId')) && (
                    <div className="filter-badge">
                        Filtered by Student <button className="button-icon" onClick={() => window.location.href = '/library/issued'}>✕</button>
                    </div>
                )}
                {new URLSearchParams(location.search).get('student') ? (
                    <button className="button button-cancel" onClick={() => window.location.href = '/library/issued'}>❌ Clear Filter</button>
                ) : <div></div>}

                <button className="button button-edit" onClick={downloadCSV}>📥 Export {isActiveView ? 'Active Loans' : 'History'} CSV</button>
            </div>

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
                            const book = t.bookId || t.book || {};
                            const student = t.studentId || t.student || {};
                            const issueDate = t.issuedAt || t.issueDate;
                            const dueDate = t.dueDate;

                            const isOverdue = t.status === 'BORROWED' && new Date() > new Date(dueDate);
                            const isDueToday = t.status === 'BORROWED' && new Date().toDateString() === new Date(dueDate).toDateString();
                            const isHighlighted = highlightedId === t._id;

                            // POLISH: Enhanced row styles for Active Loans view AND highlight
                            let rowStyle = { transition: 'background-color 0.5s ease' };

                            if (isHighlighted) {
                                rowStyle = { ...rowStyle, backgroundColor: '#dbeafe', borderLeft: '4px solid #3b82f6' }; // Highlight blue
                            } else if (isOverdue) {
                                rowStyle = { ...rowStyle, backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444' };
                            } else if (isDueToday) {
                                rowStyle = { ...rowStyle, backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b' };
                            }

                            return (
                                <tr key={t._id} id={`row-${t._id}`} style={rowStyle}>
                                    <td style={{ fontWeight: 600 }}>{book.title || "Unknown Book"}</td>
                                    <td>
                                        <div>{student.name || "Unknown"}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{student.email}</div>
                                    </td>
                                    <td>{issueDate ? new Date(issueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                                    <td style={isOverdue ? { color: '#ef4444', fontWeight: 'bold' } : {}}>
                                        {dueDate ? new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                        {isOverdue && <span style={{ fontSize: '0.7rem', display: 'block', color: '#d32f2f' }}>⚠ OVERDUE</span>}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${t.status === 'BORROWED' ? 'status-graduated' : t.status === 'RETURNED' ? 'status-active' : 'status-suspended'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td style={{ color: ((t.fineAmount > 0) || (isOverdue && !t.returnDate)) ? '#ef4444' : 'inherit', fontWeight: ((t.fineAmount > 0) || (isOverdue && !t.returnDate)) ? 700 : 400 }}>
                                        {t.fineAmount ? `$${t.fineAmount}` : (isOverdue ? `$${Math.ceil((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24)) * 5}` : '-')}
                                    </td>
                                    <td>
                                        {(t.status === 'Issued' || t.status === 'BORROWED') && (
                                            <div style={{ textAlign: 'center' }}>
                                                <Button.Group size='mini'>
                                                    <Button icon='undo' color='violet' title='Return Book' onClick={() => handleReturn(t._id)} />
                                                    <Button icon='redo' color='blue' title='Renew Book' onClick={() => handleRenew(t._id)} />
                                                </Button.Group>
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
