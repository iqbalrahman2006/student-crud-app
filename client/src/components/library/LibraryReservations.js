import React, { useState, useEffect } from 'react';
import { bookService } from '../../services/bookService';

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
            setReservations(res.data.data || []);
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="reservations-view fade-in">
            <div className="controls-bar" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#334155' }}>Active Reservations</h3>
                <span className="status-badge status-active">{reservations.length} Active</span>
            </div>

            {reservations.length === 0 ? (
                <div className="empty-state">
                    <div style={{ fontSize: '2rem' }}>📭</div>
                    <p style={{ color: '#64748b' }}>No active reservations queue.</p>
                </div>
            ) : (
                <div className="table-card">
                    <table className="student-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Book Title</th>
                                <th>Reserved Until</th>
                                <th>Queue Pos</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map(r => (
                                <tr key={r._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{r.student?.name || 'Unknown'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.student?.email}</div>
                                    </td>
                                    <td style={{ color: '#4f46e5', fontWeight: 500 }}>{r.book?.title}</td>
                                    <td>
                                        {new Date(r.expiryDate).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <span style={{
                                            background: '#f1f5f9',
                                            padding: '4px 8px',
                                            borderRadius: '50%',
                                            fontSize: '0.8rem',
                                            fontWeight: 700
                                        }}>
                                            {r.queuePosition}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="button"
                                                style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}
                                                onClick={() => handleAction(r._id, 'FULFILL')}
                                                title="Issue Book Now"
                                            >
                                                Issue
                                            </button>
                                            <button
                                                className="button button-delete"
                                                onClick={() => handleAction(r._id, 'CANCEL')}
                                                title="Cancel Reservation"
                                            >
                                                Cancel
                                            </button>
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
