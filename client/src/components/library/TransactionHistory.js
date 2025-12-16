import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { bookService } from '../../services/bookService';
import { Button } from 'semantic-ui-react';

const TransactionHistory = ({ isActiveView }) => {
    const [transactions, setTransactions] = useState([]);
    const location = useLocation();

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActiveView, location.search]);

    const loadData = async () => {
        try {
            const status = isActiveView ? 'BORROWED' : 'RETURNED';
            const res = await bookService.getTransactions(status);
            let data = res.data.data || [];

            // FILTER BY STUDENT ID IF PRESENT IN URL
            const queryParams = new URLSearchParams(location.search);
            const studentId = queryParams.get('student');
            if (studentId) {
                data = data.filter(t => (t.studentId?._id === studentId || t.student?._id === studentId || t.studentId === studentId));
            }

            setTransactions(data);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                {new URLSearchParams(location.search).get('student') && (
                    <div className="filter-badge">
                        Filtered by Student <button className="button-icon" onClick={() => window.history.pushState({}, '', '/library/issued') || window.dispatchEvent(new PopStateEvent('popstate'))}>✕</button>
                        {/* Actually, use history.push if possible, or just link. simpler: */}
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

                            // POLISH: Enhanced row styles for Active Loans view
                            let rowStyle = {};
                            if (isOverdue) rowStyle = { backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444' }; // Red border for overdue
                            else if (isDueToday) rowStyle = { backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b' }; // Orange for due today

                            return (
                                <tr key={t._id} style={rowStyle}>
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
