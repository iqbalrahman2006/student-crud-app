import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import DailyActivityLog from './DailyActivityLog'; // NEW

const AuditLogs = () => {
    const history = useHistory();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        action: '',
        start: '',
        end: ''
    });

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line
    }, [page, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (filters.action) params.action = filters.action;
            if (filters.start) params.start = filters.start;
            if (filters.end) params.end = filters.end;

            const res = await analyticsService.getAuditLogs(params);
            setLogs(res.data?.data?.items || []);
            setTotal(res.data?.data?.total || 0);
        } catch (err) {
            console.error("Failed to fetch logs", err);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    const handleReset = () => {
        setFilters({ action: '', start: '', end: '' });
        setPage(1);
    };

    const getActionColor = (action) => {
        const colors = {
            BORROW: 'blue', RETURN: 'green', OVERDUE: 'red',
            ADD: 'purple', DELETE: 'red', UPDATE: 'orange', RENEW: 'teal'
        };
        return colors[action] || 'gray';
    };

    return (
        <div className="audit-logs-container fade-in" style={{ padding: '20px' }}>
            {/* Daily Activity Summary */}
            <DailyActivityLog />

            <div className="filter-bar" style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <select name="action" value={filters.action} onChange={handleFilterChange} className="form-control" style={{ maxWidth: '150px' }}>
                    <option value="">All Actions</option>
                    <option value="BORROW">Borrow</option>
                    <option value="RETURN">Return</option>
                    <option value="RENEW">Renew</option>
                    <option value="RESERVE">Reserve</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="ADD">Add Book</option>
                    <option value="UPDATE">Update Book</option>
                    <option value="DELETE">Delete Book</option>
                </select>
                <input type="date" name="start" value={filters.start} onChange={handleFilterChange} className="form-control" />
                <input type="date" name="end" value={filters.end} onChange={handleFilterChange} className="form-control" />
                <button className="button button-outline" onClick={handleReset}>Reset</button>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '20px' }}>Loading Logs...</div> : (
                <>
                    <div className="table-responsive" style={{ background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Timestamp</th>
                                    <th style={{ padding: '12px' }}>Action</th>
                                    <th style={{ padding: '12px' }}>Book</th>
                                    <th style={{ padding: '12px' }}>Student</th>
                                    <th style={{ padding: '12px' }}>Admin</th>
                                    <th style={{ padding: '12px' }}>Metadata</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(logs || []).map(log => (
                                    <tr key={log._id || Math.random()} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span className={`badge badge-${getActionColor(log.action)}`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'white', background: getActionColor(log.action) === 'red' ? '#ef4444' : getActionColor(log.action) === 'green' ? '#10b981' : '#6366f1' }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td
                                            style={{ padding: '12px', cursor: 'pointer', color: '#2563eb', fontWeight: 500 }}
                                            onClick={() => log.bookId && history.push(`/library/inventory?open=${log.bookId._id}`)}
                                            title="View Book"
                                        >
                                            {log.bookTitle}
                                        </td>
                                        <td style={{ padding: '12px' }}>{log.studentName}</td>
                                        <td style={{ padding: '12px' }}>{log.adminName}</td>
                                        <td style={{ padding: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                                            {log.metadata ? JSON.stringify(log.metadata).substring(0, 50) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No records found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button className="button button-outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                        <span>Page {page} of {Math.ceil(total / 20)}</span>
                        <button className="button button-outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AuditLogs;
