import React, { useState, useEffect } from 'react';
import { bookService } from '../../services/bookService';
import ReservationModal from './ReservationModal';
import ActionGuard from '../../utils/ActionGuard';
import { Table, Icon, Label, Button, Segment, Header } from 'semantic-ui-react';

const BookInventory = ({ onEdit, onIssue, viewMode }) => {
    const [books, setBooks] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [reservingBook, setReservingBook] = useState(null);

    const loadBooks = React.useCallback(async (overdue = false, searchQuery = '', currentPage = 1) => {
        try {
            const params = {
                page: currentPage,
                limit: 50,
                overdue: overdue
            };
            if (searchQuery) params.search = searchQuery;

            const res = await bookService.getAll(params);
            setBooks(res.data.data || []);
            setTotal(res.data.total || 0);
            setTotalPages(res.data.totalPages || 1);
        } catch (e) {
            console.error("Failed to load books");
        }
    }, [page]); // Re-create if page dependency changes structure, but mostly used in useEffect

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const isOverdue = queryParams.get('filter') === 'overdue';
        const openId = queryParams.get('open');
        const searchParam = queryParams.get('search');
        const deptParam = queryParams.get('department');

        // Initial Load with Params
        loadBooks(isOverdue, searchParam || filter, page);

        // Auto-refresh interval (keep current page)
        const interval = setInterval(() => loadBooks(isOverdue, searchParam || filter, page), 30000);

        if (openId) setFilter(openId);
        if (searchParam) setFilter(searchParam);
        if (deptParam) setDeptFilter(deptParam);

        return () => clearInterval(interval);
    }, [filter, loadBooks, page]);



    const handleReserve = async (data) => {
        try {
            await bookService.reserve(data);
            alert("Reservation Successful! Added to queue.");
            loadBooks(); // Reflect any status changes?
        } catch (err) {
            throw err; // Modal handles alert
        }
    };

    // FILTERING
    const filteredBooks = books.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(filter.toLowerCase()) ||
            b.author.toLowerCase().includes(filter.toLowerCase()) ||
            b.isbn.includes(filter) ||
            (b._id === filter);
        const matchesDept = deptFilter ? b.department === deptFilter : true;
        return matchesSearch && matchesDept;
    });

    const departments = [...new Set(books.map(b => b.department))].filter(Boolean);
    const isConsolidated = viewMode === 'consolidated';

    return (
        <div className="book-inventory fade-in" style={{ padding: '0 0 20px 0' }}>
            {reservingBook && (
                <ReservationModal
                    book={reservingBook}
                    onClose={() => setReservingBook(null)}
                    onConfirm={handleReserve}
                />
            )}

            {/* CONTROLS */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                background: '#ffffff',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                alignItems: 'center'
            }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', color: '#94a3b8' }}>🔍</span>
                    <input
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 48px',
                            borderRadius: '12px',
                            border: '2px solid #f1f5f9',
                            background: '#f8fafc',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                        }}
                        placeholder="Search Title, Author, ISBN..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
                    />
                </div>
                <select
                    style={{
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: '2px solid #f1f5f9',
                        background: '#f8fafc',
                        fontSize: '0.95rem',
                        color: '#475569',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                >
                    <option value="">All Departments</option>
                    {(departments || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{total} BOOKS TOTAL</div>
                </div>
            </div>

            {/* LIST VIEW */}
            <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                border: '1px solid #f1f5f9'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Book Details</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location / Dept</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                            <th style={{ padding: '20px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBooks.map(b => {
                            const isOverdueView = new URLSearchParams(window.location.search).get('filter') === 'overdue';
                            const rowStyle = isOverdueView ? { backgroundColor: '#fff1f2' } : {};

                            return (
                                <tr key={b._id} style={{ ...rowStyle, borderBottom: '1px solid #f1f5f9', transition: 'all 0.2s ease' }} className="table-row-hover">
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem', marginBottom: '4px', cursor: 'pointer' }} onClick={() => onEdit(b)}>
                                            {b.title}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '12px' }}>
                                            <span>👤 {b.author}</span>
                                            <span>🆔 {b.isbn}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                                                📍 <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>{b.shelfLocation || 'Main Stacks'}</span>
                                            </span>
                                            <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                🏢 <span style={{ color: '#6366f1', fontWeight: 600 }}>{b.department}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            background: b.availableCopies > 0 ? '#dcfce7' : '#fee2e2',
                                            color: b.availableCopies > 0 ? '#15803d' : '#b91c1c'
                                        }}>
                                            <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                                            {b.availableCopies > 0 ? 'AVAILABLE' : 'UNAVAILABLE'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', fontWeight: 500 }}>
                                            {b.availableCopies} / {b.totalCopies} Copies
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => onEdit(b)}
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }}
                                                title="Edit Book"
                                            >✏️</button>

                                            {b.availableCopies > 0 ? (
                                                <ActionGuard actionKey="BOOK_ISSUE" handler={() => onIssue(b)} role="ADMIN">
                                                    <button
                                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}
                                                    >ISSUE</button>
                                                </ActionGuard>
                                            ) : (
                                                <ActionGuard actionKey="BOOK_RESERVE" handler={() => setReservingBook(b)} role="ADMIN">
                                                    <button
                                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)' }}
                                                    >QUEUE</button>
                                                </ActionGuard>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* FOOTER / PAGINATION */}
                <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                        Showing <span style={{ color: '#1e293b', fontWeight: 700 }}>{books.length}</span> of {total} Books | Page {page} of {totalPages || 1}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page === 1 ? '#f1f5f9' : '#ffffff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                        >◀</button>
                        <div style={{ padding: '8px 16px', borderRadius: '8px', background: '#6366f1', color: 'white', fontWeight: 700 }}>{page}</div>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page >= totalPages ? '#f1f5f9' : '#ffffff', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                        >▶</button>
                    </div>
                </div>
            </div>

            <style>{`
                .table-row-hover:hover {
                    background-color: #f8fafc !important;
                    transform: translateX(4px);
                }
            `}</style>
        </div>
    );
};

export default BookInventory;
