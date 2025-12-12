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
                setStudents(res.data.data || []);
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
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Reserve Book</h3>
                <p><strong>{book.title}</strong></p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Select Student</label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            required
                            className="input-field"
                        >
                            <option value="">-- Choose Student --</option>
                            {students.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.department})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Reserved Until</label>
                        <input
                            type="date"
                            value={reservedUntil}
                            onChange={(e) => setReservedUntil(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="button button-outline">Cancel</button>
                        <button type="submit" disabled={loading || !selectedStudent} className="button button-primary">
                            {loading ? 'Reserving...' : 'Confirm Reservation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationModal;
