import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';

const DailyActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ borrowed: 0, returned: 0, overdue: 0, emails: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await analyticsService.getAuditLogs({ limit: 100 }); // Fetch recent logs
            const allLogs = res.data?.data?.items || [];

            // Filter for "Today" (simulated or real)
            const today = new Date().toDateString();
            const safeLogs = Array.isArray(allLogs) ? allLogs : [];
            const todaysLogs = safeLogs.filter(l => l.timestamp && new Date(l.timestamp).toDateString() === today);

            // Calculate Stats (Fix: Action is BORROW not ISSUE in Schema)
            const newStats = {
                borrowed: todaysLogs.filter(l => l.action === 'BORROW').length,
                returned: todaysLogs.filter(l => l.action === 'RETURN').length,
                overdue: todaysLogs.filter(l => l.action === 'OVERDUE').length, // Consistent with Schema?
                emails: todaysLogs.filter(l => l.action === 'EMAIL_SENT').length
            };

            setLogs(todaysLogs);
            setStats(newStats);
        } catch (e) {
            console.error("Failed to load activity log", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '20px', color: '#64748b' }}>Loading Activity...</div>;

    return (
        <div className="daily-activity-log fade-in">
            <div className="activity-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div className="summary-pill" style={{ background: '#e0e7ff', color: '#4338ca', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
                    <div style={{ fontSize: '1.2rem' }}>{stats.borrowed}</div>
                    <div style={{ fontSize: '0.75rem' }}>Borrowed Today</div>
                </div>
                <div className="summary-pill" style={{ background: '#dcfce7', color: '#15803d', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
                    <div style={{ fontSize: '1.2rem' }}>{stats.returned}</div>
                    <div style={{ fontSize: '0.75rem' }}>Returned</div>
                </div>
                <div className="summary-pill" style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
                    <div style={{ fontSize: '1.2rem' }}>{stats.overdue}</div>
                    <div style={{ fontSize: '0.75rem' }}>Overdue Triggers</div>
                </div>
                <div className="summary-pill" style={{ background: '#f3e8ff', color: '#7e22ce', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>
                    <div style={{ fontSize: '1.2rem' }}>{stats.emails}</div>
                    <div style={{ fontSize: '0.75rem' }}>Emails Sent</div>
                </div>
            </div>

            <div className="log-list-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#475569' }}>Detailed Activity Feed</h4>
                {logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                        <p style={{ fontStyle: 'italic', marginBottom: '10px' }}>No activity recorded today.</p>
                        <button
                            className="button button-edit"
                            style={{ fontSize: '0.8rem' }}
                            onClick={async () => {
                                try {
                                    await analyticsService.request('/library/debug/seed-logs', 'POST');
                                    window.location.reload();
                                } catch (e) { alert("Seed Failed"); }
                            }}
                        >
                            🛠️ Generate Test Data
                        </button>
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {logs.map(log => (
                            <li key={log._id} style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: '60px' }}>
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={`status-badge ${log.action === 'BORROW' ? 'status-active' : log.action === 'RETURN' ? 'status-success' : 'status-inactive'}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                    {log.action}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                                    {log.details || "System Action"} <span style={{ color: '#64748b' }}>by {log.admin}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default DailyActivityLog;
