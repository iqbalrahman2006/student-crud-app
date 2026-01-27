import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';

const ReservationModal = ({ book, onClose, onConfirm }) => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [reservedUntil, setReservedUntil] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                // We need a simple list, maybe search based?
                // For now, fetch top 20 active or specific search
                const res = await studentService.getAll({ limit: 100 });
                // Handle various response structures safely
                const list = Array.isArray(res.data) ? res.data :
                    (res.data && Array.isArray(res.data.data)) ? res.data.data : [];
                setStudents(list);
            } catch (err) {
                console.error("Failed to load students for modal", err);
            }
        };
        fetchStudents();

        // Default expiry: 3 days
        const date = new Date();
        date.setDate(date.getDate() + 3);
        setReservedUntil(date.toISOString().split('T')[0]);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onConfirm({
                bookId: book._id,
                studentId: selectedStudent,
                reservedUntil
            });
            onClose();
        } catch (err) {
            alert("Reservation Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!book) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '90%',
                maxWidth: '520px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '28px 32px',
                    color: '#ffffff'
                }}>
                    <h2 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        letterSpacing: '-0.5px'
                    }}>📚 Reserve Book</h2>
                    <p style={{
                        margin: 0,
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.95)'
                    }}>{book.title}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
                    {/* Student Selection */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '10px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>Select Student</label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                fontSize: '0.95rem',
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                background: '#ffffff',
                                color: '#1e293b',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#667eea';
                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <option value="">-- Choose Student --</option>
                            {students.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.department})</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Selection */}
                    <div style={{ marginBottom: '32px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '10px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>Reserved Until</label>
                        <input
                            type="date"
                            value={reservedUntil}
                            onChange={(e) => setReservedUntil(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                fontSize: '0.95rem',
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                background: '#ffffff',
                                color: '#1e293b',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#667eea';
                                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '12px 28px',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                background: '#ffffff',
                                color: '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = '#cbd5e1';
                                e.target.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.background = '#ffffff';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedStudent}
                            style={{
                                padding: '12px 28px',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                border: 'none',
                                borderRadius: '10px',
                                background: loading || !selectedStudent
                                    ? '#cbd5e1'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#ffffff',
                                cursor: loading || !selectedStudent ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: loading || !selectedStudent
                                    ? 'none'
                                    : '0 4px 12px rgba(102, 126, 234, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading && selectedStudent) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading && selectedStudent) {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                                }
                            }}
                        >
                            {loading ? '⏳ Reserving...' : '✓ Confirm Reservation'}
                        </button>
                    </div>
                </form>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default ReservationModal;
