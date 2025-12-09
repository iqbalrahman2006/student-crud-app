import React, { useState, useEffect } from 'react';
import { getBooks, deleteBook } from '../../services/api';

const BookInventory = ({ onEdit, onIssue }) => {
    const [books, setBooks] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [filter, setFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const isOverdue = queryParams.get('filter') === 'overdue';
        const openId = queryParams.get('open');
        const deptParam = queryParams.get('department');

        loadBooks(isOverdue);

        if (openId) {
            setFilter(openId);
        }
        if (deptParam) {
            setDeptFilter(deptParam);
        }
    }, []);

    const loadBooks = async (overdue = false) => {
        try {
            const params = overdue ? { overdue: true, page: 1, limit: 25 } : { page: 1, limit: 25 };
            const res = await getBooks(params);
            setBooks(res.data.data || []);
        } catch (e) {
            console.error("Failed to load books");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this book?")) return;
        try {
            await deleteBook(id);
            loadBooks();
        } catch (e) {
            alert("Delete failed");
        }
    };

    // FILTERING
    const filteredBooks = books.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(filter.toLowerCase()) ||
            b.author.toLowerCase().includes(filter.toLowerCase()) ||
            b.isbn.includes(filter) ||
            (b._id === filter); // Support ID search
        const matchesDept = deptFilter ? b.department === deptFilter : true;
        return matchesSearch && matchesDept;
    });

    const departments = [...new Set(books.map(b => b.department))].filter(Boolean);

    return (
        <div className="book-inventory fade-in">
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
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={`button ${viewMode === 'list' ? 'status-active' : 'button-edit'}`} onClick={() => setViewMode('list')}>📋 List</button>
                    <button className={`button ${viewMode === 'card' ? 'status-active' : 'button-edit'}`} onClick={() => setViewMode('card')}>🔳 Cards</button>
                </div>
            </div>

            {/* LIST VIEW */}
            {viewMode === 'list' && (
                <div className="table-card">
                    <div className="table-container">
                        <table className="student-table sticky-header">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Author / ISBN</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBooks.map(b => (
                                    <tr key={b._id}>
                                        <td
                                            style={{ fontWeight: 600, cursor: 'pointer', color: '#4f46e5' }}
                                            onClick={() => onEdit(b)}
                                            title="Click to Edit/View"
                                        >
                                            {b.title}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.9rem' }}>{b.author}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ISBN: {b.isbn}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>{b.department}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${b.availableCopies > 0 ? 'status-active' : 'status-suspended'}`}>
                                                {b.availableCopies} Available
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="button button-edit" onClick={() => onEdit(b)}>Edit</button>
                                                <button className="button button-delete" onClick={() => handleDelete(b._id)}>🗑️</button>
                                                {b.availableCopies > 0 && (
                                                    <button className="button button-submit" style={{ padding: '6px 12px' }} onClick={() => onIssue(b)}>Issue</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CARD VIEW */}
            {viewMode === 'card' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {filteredBooks.map(b => (
                        <div key={b._id} className="stat-card" style={{ display: 'block', padding: '20px' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6366f1', fontWeight: 700 }}>{b.department}</span>
                            </div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{b.title}</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{b.author}</p>

                            <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={`status-badge ${b.availableCopies > 0 ? 'status-active' : 'status-suspended'}`} style={{ fontSize: '0.65rem' }}>
                                    {b.availableCopies} Left
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ISBN: {b.isbn}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button className="button button-edit" style={{ textAlign: 'center' }} onClick={() => onEdit(b)}>Edit</button>
                                <button
                                    className="button button-submit"
                                    style={{ textAlign: 'center', opacity: b.availableCopies > 0 ? 1 : 0.5 }}
                                    disabled={b.availableCopies < 1}
                                    onClick={() => onIssue(b)}
                                >
                                    Issue
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookInventory;
