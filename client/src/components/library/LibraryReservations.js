import React, { useState, useEffect } from 'react';
import { bookService } from '../../services/bookService';
import ActionGuard from '../../utils/ActionGuard';

const LibraryReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReservations();
    }, []);

    const loadReservations = async () => {
        try {
            const res = await bookService.getReservations('Active');
            // Fix: res.data is the axios body. res.data.data is the array.
            const data = res.data.data || [];

            // LAYER 11: DBMS Integrity - Detect corruption and fail loudly
            const hasCorruption = data.some(r => !r.student || !r.book);

            if (hasCorruption) {
                console.error('DBMS CORRUPTION DETECTED: Orphan reservation records found');
                alert('DATABASE CORRUPTION ERROR: Invalid reservation records detected. Please contact administrator to run database repair.');
                // Filter out corrupted records to prevent UI crash, but alert user
                const validReservations = data.filter(r => r.student && r.book);
                setReservations(validReservations);
            } else {
                setReservations(data);
            }
        } catch (e) {
            console.error("Failed to load reservations", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (reservationId, actionType) => {
        if (!window.confirm(`Are you sure you want to ${actionType} this reservation?`)) return;
        try {
            await bookService.manageReservation({ reservationId, action: actionType });
            loadReservations(); // Refresh
            alert("Action Successful");
        } catch (e) {
            alert(e.message || "Action Failed");
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '1.1rem' }}>Loading reservations...</div>;

    return (
        <div className="reservations-view fade-in" style={{ padding: '24px' }}>
            {/* Header Section */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '24px 32px',
                marginBottom: '32px',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{
                        margin: 0,
                        color: '#ffffff',
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        letterSpacing: '-0.5px'
                    }}>Active Reservations</h2>
                    <p style={{
                        margin: '4px 0 0 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.95rem'
                    }}>Manage book reservation queue</p>
                </div>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                        {reservations.length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)', marginTop: '4px' }}>
                        In Queue
                    </div>
                </div>
            </div>

            {reservations.length === 0 ? (
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderRadius: '16px',
                    padding: '60px 40px',
                    textAlign: 'center',
                    border: '2px dashed #cbd5e1'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📭</div>
                    <h3 style={{ color: '#475569', fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px 0' }}>
                        No Active Reservations
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                        The reservation queue is currently empty
                    </p>
                </div>
            ) : (
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.95rem'
                    }}>
                        <thead>
                            <tr style={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                borderBottom: '2px solid #e2e8f0'
                            }}>
                                <th style={{
                                    padding: '18px 24px',
                                    textAlign: 'left',
                                    color: '#1e293b',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Student</th>
                                <th style={{
                                    padding: '18px 24px',
                                    textAlign: 'left',
                                    color: '#1e293b',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Book Title</th>
                                <th style={{
                                    padding: '18px 24px',
                                    textAlign: 'left',
                                    color: '#1e293b',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Reserved Until</th>
                                <th style={{
                                    padding: '18px 24px',
                                    textAlign: 'center',
                                    color: '#1e293b',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Queue Position</th>
                                <th style={{
                                    padding: '18px 24px',
                                    textAlign: 'right',
                                    color: '#1e293b',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map((r, index) => (
                                <tr key={r._id} style={{
                                    borderBottom: index < reservations.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    transition: 'all 0.2s ease',
                                    background: '#ffffff'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.transform = 'scale(1.005)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', marginBottom: '4px' }}>
                                            {r.student.name}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {r.student.email}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{
                                            color: '#6366f1',
                                            fontWeight: 600,
                                            fontSize: '0.95rem'
                                        }}>
                                            {r.book.title}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{
                                            color: '#475569',
                                            fontSize: '0.9rem',
                                            fontWeight: 500
                                        }}>
                                            {new Date(r.expiryDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '44px',
                                            height: '44px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: '50%',
                                            fontSize: '1rem',
                                            fontWeight: 800,
                                            color: '#ffffff',
                                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                        }}>
                                            {r.queuePosition}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{
                                            display: 'flex',
                                            gap: '10px',
                                            justifyContent: 'flex-end'
                                        }}>
                                            <ActionGuard actionKey="RESERVATION_FULFILL" handler={() => handleAction(r._id, 'FULFILL')} role="ADMIN">
                                                <button
                                                    title="Issue Book Now"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        padding: '10px 20px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                                                    }}
                                                >
                                                    ✓ Issue
                                                </button>
                                            </ActionGuard>

                                            <ActionGuard actionKey="RESERVATION_CANCEL" handler={() => handleAction(r._id, 'CANCEL')} role="ADMIN">
                                                <button
                                                    title="Cancel Reservation"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        padding: '10px 20px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                                                    }}
                                                >
                                                    ✕ Cancel
                                                </button>
                                            </ActionGuard>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LibraryReservations;
