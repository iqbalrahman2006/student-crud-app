import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { getBooks, addBook, updateBook, deleteBook, issueBook, returnBook, renewBook, getTransactions } from '../services/api';
import '../App.css';

const Library = ({ students }) => { // Receives students prop for Issue modal
    const [activeTab, setActiveTab] = useState('books'); // books, issued, history
    const [books, setBooks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

    // Form States
    const [currentBook, setCurrentBook] = useState(null); // For Edit
    const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', genre: '', totalCopies: 1 });
    const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', days: 14 });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'books') {
                const res = await getBooks();
                setBooks(res.data.data || []);
            } else if (activeTab === 'issued') {
                const res = await getTransactions('Issued');
                setTransactions(res.data.data || []);
            } else if (activeTab === 'history') {
                const res = await getTransactions('Returned'); // Or all
                setTransactions(res.data.data || []);
            }
        } catch (e) {
            console.error("Failed to load library data", e);
        } finally {
            setLoading(false);
        }
    };

    // --- BOOK CRUD ---
    const handleBookSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentBook) {
                await updateBook(currentBook._id, bookForm);
            } else {
                await addBook(bookForm);
            }
            setIsBookModalOpen(false);
            setBookForm({ title: '', author: '', isbn: '', genre: '', totalCopies: 1 });
            setCurrentBook(null);
            loadData();
        } catch (e) {
            alert("Error saving book: " + (e.response?.data?.message || e.message));
        }
    };

    const handleDeleteBook = async (id) => {
        if (!window.confirm("Delete this book?")) return;
        try {
            await deleteBook(id);
            loadData();
        } catch (e) {
            alert("Error deleting book");
        }
    };

    const openEditBook = (book) => {
        setCurrentBook(book);
        setBookForm({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            totalCopies: book.totalCopies
        });
        setIsBookModalOpen(true);
    };

    // --- TRANSACTIONS ---
    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        try {
            await issueBook(issueForm);
            setIsIssueModalOpen(false);
            setIssueForm({ bookId: '', studentId: '', days: 14 });
            // Refresh logic depends on where we are, but usually go to 'issued' tab
            setActiveTab('issued');
        } catch (e) {
            alert("Issue Failed: " + (e.response?.data?.message || e.message));
        }
    };

    const handleReturn = async (txnId) => {
        if (!window.confirm("Confirm return?")) return;
        try {
            await returnBook({ transactionId: txnId });
            insertSystemMessage("Returning book...");
            loadData();
        } catch (e) {
            alert("Return Failed");
        }
    };

    const handleRenew = async (txnId) => {
        try {
            await renewBook({ transactionId: txnId });
            loadData();
        } catch (e) {
            alert("Renew Failed");
        }
    };

    // Email Trigger
    const handleTriggerReminders = async () => {
        setIsTriggering(true);
        try {
            await import('../services/api').then(m => m.triggerReminders());
            alert("✅ Reminders Sent Successfully!");
        } catch (e) {
            alert("Trigger Failed: " + e.message);
        } finally {
            setIsTriggering(false);
        }
    };

    // Quick Hack for toast-like behavior if main app toast isn't exposed
    const insertSystemMessage = (msg) => console.log(msg);

    // Alert Status Modal
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);

    return (
        <div className="library-container fade-in">
            <div className="report-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2>📚 Library Management</h2>
                    <button className="button button-sm" style={{ backgroundColor: '#6366f1', fontSize: '0.8rem' }} onClick={() => setIsAlertsOpen(true)}>
                        🔔 Email Alerts
                    </button>
                </div>
                <div className="action-buttons">
                    <button className={`button ${activeTab === 'books' ? 'status-active' : 'button-edit'}`} onClick={() => setActiveTab('books')}>Books Inventory</button>
                    <button className={`button ${activeTab === 'issued' ? 'status-active' : 'button-edit'}`} onClick={() => setActiveTab('issued')}>Issued Books</button>
                    <button className={`button ${activeTab === 'history' ? 'status-active' : 'button-edit'}`} onClick={() => setActiveTab('history')}>History</button>
                </div>
            </div>

            {/* TAB CONTENT */}
            <div className="workspace-content" style={{ marginTop: '20px' }}>

                {activeTab === 'books' && (
                    <>
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="button button-submit" onClick={() => { setCurrentBook(null); setIsBookModalOpen(true); }}>+ Add New Book</button>
                        </div>
                        <div className="table-card">
                            <table className="student-table sticky-header">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Author</th>
                                        <th>ISBN</th>
                                        <th>Genre</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {books.map(b => (
                                        <tr key={b._id}>
                                            <td style={{ fontWeight: 600 }}>{b.title}</td>
                                            <td>{b.author}</td>
                                            <td>{b.isbn}</td>
                                            <td>{b.genre}</td>
                                            <td>
                                                <span className={`status-badge ${b.availableCopies > 0 ? 'status-active' : 'status-suspended'}`}>
                                                    {b.availableCopies} / {b.totalCopies} Available
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="button button-edit" onClick={() => openEditBook(b)}>Edit</button>
                                                    <button className="button button-delete" onClick={() => handleDeleteBook(b._id)}>Delete</button>
                                                    {b.availableCopies > 0 && (
                                                        <button
                                                            className="button button-submit"
                                                            style={{ padding: '6px 10px' }}
                                                            onClick={() => { setIssueForm(prev => ({ ...prev, bookId: b._id })); setIsIssueModalOpen(true); }}
                                                        >Issue</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && books.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No books found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {(activeTab === 'issued' || activeTab === 'history') && (
                    <div className="table-card">
                        <table className="student-table sticky-header">
                            <thead>
                                <tr>
                                    <th>Book Title</th>
                                    <th>Student</th>
                                    <th>Issue Date</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => {
                                    const isOverdue = new Date() > new Date(t.dueDate) && t.status === 'Issued';
                                    return (
                                        <tr key={t._id} style={isOverdue ? { backgroundColor: '#fff1f2' } : {}}>
                                            <td style={{ fontWeight: 600 }}>{t.book?.title || "Unknown Book"}</td>
                                            <td>{t.student?.name || "Unknown Student"}</td>
                                            <td>{new Date(t.issueDate).toLocaleDateString()}</td>
                                            <td style={isOverdue ? { color: 'red', fontWeight: 'bold' } : {}}>
                                                {new Date(t.dueDate).toLocaleDateString()} {isOverdue && "(OVERDUE)"}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${t.status === 'Issued' ? 'status-graduated' : 'status-active'}`}>
                                                    {t.status}
                                                </span>
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
                                {!loading && transactions.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No transactions found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ADD/EDIT BOOK MODAL */}
            <Modal
                isOpen={isBookModalOpen}
                onRequestClose={() => setIsBookModalOpen(false)}
                className="modal"
                overlayClassName="overlay"
            >
                <div className="modal-header">
                    <h2>{currentBook ? "Edit Book" : "Add New Book"}</h2>
                    <button className="button-icon" onClick={() => setIsBookModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={handleBookSubmit} className="modal-content-scroll form">
                    <div className="message-grid">
                        <div className="form-group floating-label-group">
                            <input className="floating-input" name="title" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} required placeholder=" " />
                            <label className="floating-label">Book Title</label>
                        </div>
                        <div className="form-group floating-label-group">
                            <input className="floating-input" name="author" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} required placeholder=" " />
                            <label className="floating-label">Author</label>
                        </div>
                        <div className="form-group floating-label-group">
                            <input className="floating-input" name="isbn" value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} required placeholder=" " />
                            <label className="floating-label">ISBN</label>
                        </div>
                        <div className="form-group floating-label-group">
                            <input className="floating-input" name="genre" value={bookForm.genre} onChange={e => setBookForm({ ...bookForm, genre: e.target.value })} placeholder=" " />
                            <label className="floating-label">Genre</label>
                        </div>
                        <div className="form-group floating-label-group">
                            <input type="number" className="floating-input" name="totalCopies" value={bookForm.totalCopies} onChange={e => setBookForm({ ...bookForm, totalCopies: e.target.value })} required min="1" placeholder=" " />
                            <label className="floating-label">Total Copies</label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="button button-cancel" onClick={() => setIsBookModalOpen(false)}>Cancel</button>
                        <button type="submit" className="button button-submit">Save Book</button>
                    </div>
                </form>
            </Modal>

            {/* ISSUE BOOK MODAL */}
            <Modal
                isOpen={isIssueModalOpen}
                onRequestClose={() => setIsIssueModalOpen(false)}
                className="modal"
                overlayClassName="overlay"
            >
                <div className="modal-header">
                    <h2>Issue Book</h2>
                    <button className="button-icon" onClick={() => setIsIssueModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={handleIssueSubmit} className="modal-content-scroll form">
                    <p>Issuing <strong>{books.find(b => b._id === issueForm.bookId)?.title}</strong></p>

                    <div className="form-group floating-label-group" style={{ marginTop: '20px' }}>
                        <select
                            className="floating-input"
                            value={issueForm.studentId}
                            onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })}
                            required
                        >
                            <option value="">Select Student...</option>
                            {students.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.course})</option>
                            ))}
                        </select>
                        <label className="floating-label" style={{ top: '6px', fontSize: '0.75rem', color: 'var(--primary)' }}>Student</label>
                    </div>

                    <div className="form-group floating-label-group">
                        <input
                            type="number"
                            className="floating-input"
                            value={issueForm.days}
                            onChange={e => setIssueForm({ ...issueForm, days: e.target.value })}
                            required
                            min="1"
                            max="30"
                            placeholder=" "
                        />
                        <label className="floating-label">Days for Issue</label>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="button button-cancel" onClick={() => setIsIssueModalOpen(false)}>Cancel</button>
                        <button type="submit" className="button button-submit">Confirm Issue</button>
                    </div>
                </form>
            </Modal>

            {/* ALERTS MODAL */}
            <Modal
                isOpen={isAlertsOpen}
                onRequestClose={() => setIsAlertsOpen(false)}
                className="modal"
                overlayClassName="overlay"
            >
                <div className="modal-header">
                    <h2>🔔 Email Alert System</h2>
                    <button className="button-icon" onClick={() => setIsAlertsOpen(false)}>✕</button>
                </div>
                <div className="modal-content-scroll" style={{ padding: '20px' }}>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>System Status</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            <span style={{ height: '10px', width: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
                            <span>Scheduler Active (Daily 08:00 AM)</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '5px' }}>
                            System automatically scans for overdue books and sends email notifications via <strong>NodeMailer</strong>.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontWeight: 600 }}>Manual Override</label>
                        <p style={{ fontSize: '0.85rem', margin: 0 }}>Force run the daily check now. This may take a few seconds.</p>
                        <button
                            className="button button-submit"
                            style={{ width: '100%', marginTop: '10px', opacity: isTriggering ? 0.7 : 1 }}
                            onClick={handleTriggerReminders}
                            disabled={isTriggering}
                        >
                            {isTriggering ? "🚀 Sending..." : "🚀 Run Overdue Check Now"}
                        </button>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="button button-cancel" onClick={() => setIsAlertsOpen(false)}>Close</button>
                </div>
            </Modal>
        </div>
    );
};

export default Library;
