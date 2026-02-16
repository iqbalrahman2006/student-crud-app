import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import Modal from 'react-modal';
import { bookService } from '../services/bookService';
import { analyticsService } from '../services/analyticsService';
import ActionGuard from '../utils/ActionGuard';
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
                            <ActionGuard actionKey="BOOK_CREATE" handler={() => { setCurrentBook(null); setIsBookModalOpen(true); }} role="ADMIN">
                                <button className="button button-submit">+ Add New Book</button>
                            </ActionGuard>
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

            {/* --- CUSTOM PREMIUM MODALS --- */}

            {/* ADD/EDIT BOOK MODAL */}
            {isBookModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, animation: 'fadeIn 0.2s ease'
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', width: '90%', maxWidth: '600px',
                        boxShadow: '0 30px 70px rgba(0, 0, 0, 0.3)', overflow: 'hidden', animation: 'slideUp 0.3s ease'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                            padding: '30px 35px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>{currentBook ? "📝 Edit Book" : "➕ Add New Book"}</h2>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.95rem', opacity: 0.9 }}>Fill in the details to manage the inventory copies.</p>
                            </div>
                            <button onClick={() => setIsBookModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', fontWeight: 700 }}>✕</button>
                        </div>
                        <form onSubmit={handleBookSubmit} style={{ padding: '35px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Book Title</label>
                                    <input value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} required style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '0.95rem' }} />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Author</label>
                                    <input value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} required style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '0.95rem' }} />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>ISBN</label>
                                    <input value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} required style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '0.95rem' }} />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Department</label>
                                    <select value={bookForm.department} onChange={e => setBookForm({ ...bookForm, department: e.target.value })} required style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '0.95rem' }}>
                                        <option value="General">General</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="Civil">Civil</option>
                                        <option value="Business">Business</option>
                                        <option value="Literature">Literature</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Genre</label>
                                    <input value={bookForm.genre} onChange={e => setBookForm({ ...bookForm, genre: e.target.value })} style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '0.95rem' }} />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Total Copies</label>
                                    <input type="number" value={bookForm.totalCopies} onChange={e => setBookForm({ ...bookForm, totalCopies: e.target.value })} required min="1" style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '0.95rem' }} />
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsBookModalOpen(false)} style={{ padding: '12px 25px', borderRadius: '10px', border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <ActionGuard
                                    actionKey={currentBook ? "BOOK_UPDATE" : "BOOK_CREATE"}
                                    handler={handleBookSubmit}
                                    role="ADMIN"
                                >
                                    <button type="submit" style={{ padding: '12px 30px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}>Save changes</button>
                                </ActionGuard>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ISSUE BOOK MODAL */}
            {isIssueModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, animation: 'fadeIn 0.2s ease'
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', width: '90%', maxWidth: '480px',
                        boxShadow: '0 30px 70px rgba(0, 0, 0, 0.3)', overflow: 'hidden', animation: 'slideUp 0.3s ease'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            padding: '30px 35px', color: '#ffffff'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>📤 Issue Book</h2>
                            <p style={{ margin: '5px 0 0 0', fontSize: '1rem', fontWeight: 500, opacity: 0.95 }}>Select a student and duration to issue this copy.</p>
                        </div>
                        <form onSubmit={handleIssueSubmit} style={{ padding: '35px' }}>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Student</label>
                                <select
                                    value={issueForm.studentId}
                                    onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: 500 }}
                                >
                                    <option value="">Select Student...</option>
                                    {students?.filter(s => s).map(s => <option key={s._id} value={s._id}>{s.name} ({s.course})</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '35px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Duration (Days)</label>
                                <input type="number" value={issueForm.days} onChange={e => setIssueForm({ ...issueForm, days: e.target.value })} required min="1" max="30" style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: 500 }} />
                            </div>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsIssueModalOpen(false)} style={{ padding: '12px 25px', borderRadius: '10px', border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ padding: '12px 30px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>Confirm Issue</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ALERTS MODAL */}
            {isAlertsOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, animation: 'fadeIn 0.2s ease'
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', width: '90%', maxWidth: '520px',
                        boxShadow: '0 30px 70px rgba(0, 0, 0, 0.3)', overflow: 'hidden', animation: 'slideUp 0.3s ease'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
                            padding: '30px 35px', color: '#ffffff'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🔔 Email Alerts Center</h2>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.95rem', opacity: 0.9 }}>System-wide notification engine status and manual controls.</p>
                        </div>
                        <div style={{ padding: '35px' }}>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <span style={{ height: '12px', width: '12px', borderRadius: '50%', background: '#22c55e' }}></span>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>Scheduler Online</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>Automatic scan runs every day at 08:00 AM to notify students via html templates.</p>
                            </div>
                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Manual Control</h4>
                                <button
                                    onClick={handleTriggerReminders}
                                    disabled={isTriggering}
                                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: isTriggering ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: isTriggering ? 'not-allowed' : 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.1)' }}
                                >
                                    {isTriggering ? "🚀 Processing Engine..." : "🚀 Run Overdue Check Now"}
                                </button>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <button type="button" onClick={() => setIsAlertsOpen(false)} style={{ padding: '12px 25px', borderRadius: '10px', border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div >
    );
};

export default Library;
