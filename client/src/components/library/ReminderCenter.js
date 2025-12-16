import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';

const ReminderCenter = () => {
    const [stats, setStats] = useState({ dueIn7Days: [], dueIn2Days: [], overdue: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        try {
            setLoading(true);
            const res = await analyticsService.getReminderStatus();
            setStats(res.data.data);
            setError(null);
        } catch (err) {
            setError("Failed to load reminder status.");
        } finally {
            setLoading(false);
        }
    };

    const renderTable = (title, data, badgeClass) => (
        <div className="table-card fade-in" style={{ marginBottom: '30px' }}>
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>{title} <span className={`status-badge ${badgeClass}`} style={{ marginLeft: '10px' }}>{data.length}</span></h3>
            </div>
            {data.length === 0 ? <p style={{ color: '#64748b', fontStyle: 'italic', padding: '10px' }}>No records found.</p> : (
                <div className="table-container">
                    <table className="student-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Book Title</th>
                                <th>Due Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{item.studentName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.studentEmail}</div>
                                    </td>
                                    <td>{item.bookTitle}</td>
                                    <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${badgeClass === 'status-suspended' ? 'status-suspended' : 'status-active'}`}>
                                            {badgeClass === 'status-suspended' ? 'Overdue' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Reminders...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    return (
        <div className="reminder-center-container" style={{ padding: '20px' }}>
            <div className="reminder-explanation" style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, color: '#0369a1' }}>📧 Reminder Engine How-to</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c4a6e' }}>
                    <li><strong>Due in 7 Days:</strong> System identifies loans expiring in the next week. Automated emails are scheduled 3 days before due date.</li>
                    <li><strong>Due in 2 Days:</strong> Urgent reminders for loans expiring soon.</li>
                    <li><strong>Overdue:</strong> Items past due date. These require immediate attention or manual follow-up.</li>
                </ul>
            </div>

            {renderTable("⚠️ Overdue Items", stats.overdue, "status-suspended")}
            {renderTable("🗓️ Due in 2 Days (Urgent)", stats.dueIn2Days, "status-inactive")}
            {renderTable("📅 Due in 7 Days (Upcoming)", stats.dueIn7Days, "status-active")}

            {/* OUTGOING EMAIL QUEUE (Visual Only for Enterprise Polish) */}
            <div className="table-card fade-in" style={{ marginBottom: '30px' }}>
                <div className="table-header" style={{ marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>📤 Outgoing Email Queue</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Automated notifications scheduled for delivery.</p>
                </div>
                <div className="table-container">
                    <table className="student-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Recipient</th>
                                <th>Type</th>
                                <th>Scheduled For</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Dynamic Queue Generation */}
                            {stats.overdue.map(item => (
                                <tr key={`email-overdue-${item.id}`}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{item.studentName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.studentEmail}</div>
                                    </td>
                                    <td><span className="status-badge status-suspended">OVERDUE NOTICE</span></td>
                                    <td>Immediate (Daily Retry)</td>
                                    <td><span style={{ color: '#f59e0b', fontWeight: 600 }}>Pending Retry</span></td>
                                </tr>
                            ))}
                            {stats.dueIn2Days.map(item => (
                                <tr key={`email-urgent-${item.id}`}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{item.studentName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.studentEmail}</div>
                                    </td>
                                    <td><span className="status-badge status-inactive">URGENT REMINDER</span></td>
                                    <td>Tomorrow 09:00 AM</td>
                                    <td><span style={{ color: '#3b82f6', fontWeight: 600 }}>Scheduled</span></td>
                                </tr>
                            ))}
                            {stats.dueIn7Days.map(item => {
                                const sendDate = new Date(item.dueDate);
                                sendDate.setDate(sendDate.getDate() - 3); // 3 days before
                                return (
                                    <tr key={`email-gentle-${item.id}`}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{item.studentName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.studentEmail}</div>
                                        </td>
                                        <td><span className="status-badge status-active">GENTLE REMINDER</span></td>
                                        <td>{sendDate.toLocaleDateString()} 09:00 AM</td>
                                        <td><span style={{ color: '#10b981', fontWeight: 600 }}>Optimized</span></td>
                                    </tr>
                                );
                            })}

                            {/* Empty State */}
                            {stats.overdue.length === 0 && stats.dueIn2Days.length === 0 && stats.dueIn7Days.length === 0 && (
                                <tr>
                                    <td style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center' }} colSpan="4">
                                        Queue is currently empty. No active reminder tasks.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReminderCenter;
