import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import Modal from 'react-modal';
import { bookService } from '../services/bookService';
import { analyticsService } from '../services/analyticsService';
import '../App.css';

// Sub Components
import LibraryAnalytics from './library/LibraryAnalytics';
import BookInventory from './library/BookInventory';
import TransactionHistory from './library/TransactionHistory';
import AuditLogs from './library/AuditLogs'; // Re-trigger build
import ReminderCenter from './library/ReminderCenter';
import LibraryReservations from './library/LibraryReservations';

const Library = ({ students = [], viewMode }) => {
    const location = useLocation();
    const history = useHistory();
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, books, issued, history, logs, reminders

    React.useEffect(() => {
        Modal.setAppElement('#root');
    }, []);

    // SYNC TABS WITH URL
    React.useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        let tab = 'dashboard';

        // Check if path contains specific segments or params
        if (location.pathname.includes('/inventory') || queryParams.get('filter') || queryParams.get('open') || queryParams.get('department')) {
            tab = 'books';
        } else if (location.pathname.includes('/issued') || queryParams.get('student')) {
            tab = 'issued';
        } else if (location.pathname.includes('/history')) {
            tab = 'history';
        } else if (location.pathname.includes('/logs')) {
            tab = 'logs';
        } else if (location.pathname.includes('/reservations')) {
            tab = 'reservations';
        } else if (location.pathname.includes('/reminders')) {
            tab = 'reminders';
        }

        setActiveTab(tab);
    }, [location]);

    // WRAPPER FOR TAB SWITCHING
    const switchTab = (tabName) => {
        let path = '/library';
        if (tabName === 'books') path = '/library/inventory';
        else if (tabName !== 'dashboard') path = `/library/${tabName}`;
        history.push(path);
        setActiveTab(tabName);
    };

    // 2. Issue Handlers
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const [currentBook, setCurrentBook] = useState(null);
    const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', genre: '', department: 'General', totalCopies: 1 });
    const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', days: 14 });
    const [refreshKey, setRefreshKey] = useState(0);

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentBook) await bookService.update(currentBook._id, bookForm);
            else await bookService.create(bookForm);
            setIsBookModalOpen(false);
            setBookForm({ title: '', author: '', isbn: '', genre: '', department: 'General', totalCopies: 1 });
            setCurrentBook(null);
            setRefreshKey(prev => prev + 1);
        } catch (e) { alert("Error saving book: " + (e.response?.data?.message || e.message)); }
    };

    const openEditBook = (book) => {
        setCurrentBook(book);
        setBookForm({ title: book.title, author: book.author, isbn: book.isbn, genre: book.genre, department: book.department || 'General', totalCopies: book.totalCopies });
        setIsBookModalOpen(true);
    };

    const openIssueBook = (book) => {
        setIssueForm(prev => ({ ...prev, bookId: book._id }));
        setIsIssueModalOpen(true);
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        try {
            await bookService.issue(issueForm);
            setIsIssueModalOpen(false);
            setIssueForm({ bookId: '', studentId: '', days: 14 });
            setActiveTab('issued');
            setRefreshKey(prev => prev + 1);
        } catch (e) { alert("Issue Failed: " + (e.response?.data?.message || e.message)); }
    };

    const handleTriggerReminders = async () => {
        setIsTriggering(true);
        try { await analyticsService.triggerReminders(); alert("✅ Reminders Sent!"); }
        catch (e) { alert("Trigger Failed: " + e.message); }
        finally { setIsTriggering(false); }
    };

    return (
        <div className="library-container fade-in">
            {/* HEADER */}
            <div className="report-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>📚 Library OS</h2>
                    <button className="button button-sm" style={{ backgroundColor: '#6366f1', color: 'white', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => setIsAlertsOpen(true)}>
                        <span>🔔</span> Email Engine
                    </button>
                </div>

                <div className="action-buttons">
                    <div className="action-buttons">
                        <button className={`button ${activeTab === 'dashboard' ? 'status-active' : 'button-edit'}`} onClick={() => switchTab('dashboard')}>📊 Dashboard</button>
                        <button className={`button ${activeTab === 'books' ? 'status-active' : 'button-edit'}`} onClick={() => switchTab('books')}>📖 Inventory</button>
                        <button className={`button ${activeTab === 'issued' ? 'status-active' : 'button-edit'}`} onClick={() => switchTab('issued')}>📨 Active Loans</button>
                        <button className={`button ${activeTab === 'reservations' ? 'status-active' : 'button-edit'}`} onClick={() => switchTab('reservations')}>📅 Reservations</button>
                        <button className={`button ${activeTab === 'logs' ? 'status-active' : 'button-edit'}`} onClick={() => switchTab('logs')}>🛡️ Logs</button>
                        <button className={`button ${activeTab === 'reminders' ? 'status-active' : 'button-edit'}`} onClick={() => switchTab('reminders')}>⚠️ Reminders</button>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="workspace-content" style={{ marginTop: '20px' }}>

                {activeTab === 'dashboard' && <LibraryAnalytics />}

                {activeTab === 'books' && (
                    <>
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="button button-submit" onClick={() => { setCurrentBook(null); setIsBookModalOpen(true); }}>+ Add New Book</button>
                        </div>
                        <BookInventory key={refreshKey} onEdit={openEditBook} onIssue={openIssueBook} viewMode={viewMode} />
                    </>
                )}

                {activeTab === 'issued' && (
                    <>
                        <TransactionHistory key={refreshKey} isActiveView={true} />

                        {/* Only show History if NOT deep linking to a specific active view */}
                        {!(new URLSearchParams(location.search).get('student') &&
                            ['active', 'overdue'].includes(new URLSearchParams(location.search).get('status'))) && (
                                <div style={{ marginTop: '40px', borderTop: '2px dashed #cbd5e1', paddingTop: '20px' }}>
                                    <h3 style={{ color: '#475569' }}>📜 Transaction History</h3>
                                    <TransactionHistory key={refreshKey} isActiveView={false} />
                                </div>
                            )}
                    </>
                )}

                {activeTab === 'reservations' && <LibraryReservations />}

                {activeTab === 'logs' && <AuditLogs />}

                {activeTab === 'reminders' && <ReminderCenter />}
            </div>

            {/* --- MODALS --- */}

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
                            <select className="floating-input" name="department" value={bookForm.department} onChange={e => setBookForm({ ...bookForm, department: e.target.value })} required>
                                <option value="General">General</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                                <option value="Business">Business</option>
                                <option value="Literature">Literature</option>
                            </select>
                            <label className="floating-label" style={{ top: '6px', fontSize: '0.75rem', color: 'var(--primary)' }}>Department</label>
                        </div>
                        <div className="form-group floating-label-group">
                            <input className="floating-input" name="genre" value={bookForm.genre} onChange={e => setBookForm({ ...bookForm, genre: e.target.value })} placeholder=" " />
                            <label className="floating-label">Genre</label>
                        </div>
                        <div className="form-group floating-label-group">
                            <input type="number" className="floating-input" name="totalCopies" value={bookForm.totalCopies} onChange={e => setBookForm({ ...bookForm, totalCopies: e.target.value })} required min="1" placeholder=" " />
                            <label className="floating-label">Total Copies</label>
                        </div>
                        {/* Requirement G: Reservation Info Tooltip (UI Only) */}
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input type="checkbox" defaultChecked title="Enable reservations for this book" /> Allow Reservations
                            </label>
                            <div className="tooltip-container" title="Reservation allows student to queue for the book when all copies are borrowed.">
                                <span style={{ cursor: 'help', fontSize: '0.9rem' }}>ℹ️</span>
                            </div>
                        </div>

                        {/* PART 4: CIRCULATION PANEL */}
                        {currentBook && (
                            <div className="form-group" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <label style={{ fontWeight: 600, color: '#334155', display: 'block', marginBottom: '10px' }}>⚡ Circulation Actions</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="button button-submit"
                                        onClick={() => { setIsBookModalOpen(false); openIssueBook(currentBook); }}
                                        disabled={currentBook.availableCopies < 1}
                                        style={{ opacity: currentBook.availableCopies < 1 ? 0.5 : 1 }}
                                    >
                                        {currentBook.availableCopies > 0 ? "📤 Issue Copy" : "🚫 Unavailable"}
                                    </button>
                                    <button
                                        type="button"
                                        className="button button-edit"
                                        onClick={() => { setIsBookModalOpen(false); switchTab('issued'); }}
                                    >
                                        📨 View Active Loans
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>
                                    To Return or Renew, please find the specific transaction in the "Active Loans" tab or the Student's Profile.
                                </p>
                            </div>
                        )}

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
                    <div className="form-group floating-label-group" style={{ marginTop: '20px' }}>
                        <select
                            className="floating-input"
                            value={issueForm.studentId}
                            onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })}
                            required
                        >
                            <option value="">Select Student...</option>
                            {students?.filter(s => s).map(s => (
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
                            System automatically scans for overdue books and sends email notifications via <strong>NodeMailer</strong> (HTML Templates supported).
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontWeight: 600 }}>Manual Override</label>
                        <p style={{ fontSize: '0.85rem', margin: 0 }}>Force run the daily check now.</p>
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
        </div >
    );
};

export default Library;
