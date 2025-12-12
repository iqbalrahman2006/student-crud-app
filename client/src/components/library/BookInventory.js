import React, { useState, useEffect } from 'react';
import { bookService } from '../../services/bookService';
import ReservationModal from './ReservationModal';

const BookInventory = ({ onEdit, onIssue, viewMode }) => {
    const [books, setBooks] = useState([]);
    const [filter, setFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [reservingBook, setReservingBook] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const isOverdue = queryParams.get('filter') === 'overdue';
        const openId = queryParams.get('open');
        const deptParam = queryParams.get('department');

        loadBooks(isOverdue);

        // Auto-refresh interval to keep availability in sync (every 30s)
        const interval = setInterval(() => loadBooks(isOverdue), 30000);

        if (openId) setFilter(openId);
        if (deptParam) setDeptFilter(deptParam);

        return () => clearInterval(interval);
    }, []);

    const loadBooks = async (overdue = false) => {
        try {
            const params = {
                page: 1, limit: 50, overdue: overdue
            };
            const res = await bookService.getAll(params);
            setBooks(res.data.data || []);
        } catch (e) {
            console.error("Failed to load books");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this book?")) return;
        try {
            await bookService.delete(id);
            loadBooks();
        } catch (e) {
            alert("Delete failed");
        }
    };

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
        <div className="book-inventory fade-in">
            {reservingBook && (
                <ReservationModal
                    book={reservingBook}
                    onClose={() => setReservingBook(null)}
                    onConfirm={handleReserve}
                />
            )}

            {/* CONTROLS */}
            <div className="controls-bar" style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <div className="search-wrapper" style={{ maxWidth: '300px' }}>
                        <span className="search-icon">🔍</span>
                        <input
                            className="search-input"
                            placeholder="Search Title, Author, ISBN..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                        <option value="">All Departments</option>
                        {(departments || []).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* LIST VIEW */}
            <div className="table-card" style={{ overflowX: isConsolidated ? 'hidden' : 'auto' }}>
                <div className="table-container">
                    <table className="student-table sticky-header" style={{ width: isConsolidated ? '100%' : '1200px' }}>
                        <thead>
                            <tr>
                                <th width={isConsolidated ? "40%" : "20%"}>Title</th>
                                <th width={isConsolidated ? "30%" : "20%"}>Author / {isConsolidated ? '' : 'ISBN'}</th>
                                {!isConsolidated && <th width="15%">Location</th>}
                                {!isConsolidated && <th width="15%">Dept / Pop.</th>}
                                <th width={isConsolidated ? "30%" : "15%"}>Status</th>
                                {!isConsolidated && <th width="15%">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBooks.map(b => {
                                const isOverdueView = new URLSearchParams(window.location.search).get('filter') === 'overdue';
                                const rowStyle = isOverdueView ? { background: '#fef2f2', borderLeft: '4px solid #ef4444' } : {};

                                return (
                                    <tr key={b._id} style={rowStyle}>
                                        <td
                                            style={{ fontWeight: 600, cursor: 'pointer', color: '#4f46e5' }}
                                            onClick={() => onEdit(b)}
                                            title="Click to View Details"
                                        >
                                            {b.title}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.9rem' }}>{b.author}</div>
                                            {!isConsolidated && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ISBN: {b.isbn}</div>}
                                        </td>

                                        {!isConsolidated && (
                                            <td>
                                                <div style={{ fontSize: '0.85rem', color: '#334155' }}>{b.shelfLocation || 'Main Stacks'}</div>
                                            </td>
                                        )}

                                        {!isConsolidated && (
                                            <td>
                                                <div style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>{b.department}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>🔥 Pop: {b.popularityIndex || 0}</div>
                                            </td>
                                        )}

                                        <td>
                                            <span className={`status-badge ${b.availableCopies > 0 ? 'status-active' : 'status-suspended'}`}>
                                                {b.availableCopies > 0 ? 'Available' : 'Unavailable'}
                                            </span>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                                {b.availableCopies} / {b.totalCopies} Copies
                                            </div>
                                        </td>

                                        {!isConsolidated && (
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="button button-edit" onClick={() => onEdit(b)}>View</button>

                                                    {b.availableCopies > 0 ? (
                                                        <button className="button button-submit" style={{ padding: '6px 12px' }} onClick={() => onIssue(b)}>Issue</button>
                                                    ) : (
                                                        <button className="button button-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setReservingBook(b)}>Reserve</button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BookInventory;
