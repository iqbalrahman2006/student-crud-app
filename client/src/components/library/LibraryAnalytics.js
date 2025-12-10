import React, { useEffect, useState } from 'react';
import { getLibraryAnalytics } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useHistory } from 'react-router-dom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const LibraryAnalytics = () => {
    const history = useHistory();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const handleNavigation = (path) => {
        if (isNavigating) return;
        setIsNavigating(true);
        // Small timeout to prevent immediate re-clicks
        setTimeout(() => setIsNavigating(false), 500);
        history.push(path);
    };

    const loadStats = async () => {
        try {
            const res = await getLibraryAnalytics();
            setData(res.data.data);
        } catch (e) {
            console.error("Analytics Load Failed", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Dashboard...</div>;
    if (!data) return <div>Error loading data.</div>;

    return (
        <div className="analytics-dashboard fade-in">
            {/* STAT CARDS */}
            <div className="stats-grid">
                <div
                    className="stat-card"
                    style={{ cursor: isNavigating ? 'wait' : 'pointer', opacity: isNavigating ? 0.7 : 1 }}
                    onClick={() => handleNavigation('/library/inventory?filter=all')}
                >
                    <div className="stat-icon icon-blue">📚</div>
                    <div className="stat-content">
                        <div className="stat-title">Total Books (View All)</div>
                        <div className="stat-value">{data.totalBooks}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-green">🚀</div>
                    <div className="stat-content">
                        <div className="stat-title">Borrowed Today</div>
                        <div className="stat-value">{data.borrowedToday}</div>
                    </div>
                </div>
                <div
                    className="stat-card"
                    style={{
                        cursor: isNavigating ? 'wait' : 'pointer',
                        border: data.overdueCount > 0 ? '1px solid #ef4444' : 'none',
                        opacity: isNavigating ? 0.7 : 1
                    }}
                    onClick={() => handleNavigation('/library/inventory?filter=overdue')}
                    title="Click to view overdue books"
                >
                    <div className="stat-icon icon-orange">⚠️</div>
                    <div className="stat-content">
                        <div className="stat-title">Overdue Books</div>
                        <div className="stat-value" style={{ color: data.overdueCount > 0 ? '#ef4444' : 'inherit' }}>{data.overdueCount}</div>
                    </div>
                </div>
                {/* NEW ENTERPRISE METRICS */}
                <div className="stat-card">
                    <div className="stat-icon icon-purple">💵</div>
                    <div className="stat-content">
                        <div className="stat-title">Fine Revenue</div>
                        <div className="stat-value">${data.totalFine || 0}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-red">⏳</div>
                    <div className="stat-content">
                        <div className="stat-title">Reservations</div>
                        <div className="stat-value">{data.reservationQueue || 0}</div>
                    </div>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button className="button button-outline" onClick={() => window.open('http://localhost:5000/api/v1/library/export', '_blank')}>📥 Export Logs (CSV)</button>
                <button className="button button-outline">📤 Bulk Import (Inventory)</button>
            </div>

            {/* CHARTS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                {/* POPULAR BOOKS */}
                <div className="table-card" style={{ padding: '20px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#64748b', textTransform: 'uppercase' }}>Most Popular Books</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.popularBooks}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                onClick={(data) => {
                                    if (data && data.activePayload && data.activePayload[0]) {
                                        // Navigate to top book if needed
                                        history.push(`/library/inventory?open=${data.activePayload[0].payload.title}`);
                                    }
                                }}
                            >
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="title" width={150} style={{ fontSize: '12px', cursor: 'pointer' }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} cursor="pointer" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* DEPARTMENT DISTRIBUTION */}
                <div className="table-card" style={{ padding: '20px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#64748b', textTransform: 'uppercase' }}>Holdings by Department</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.deptDist}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="_id"
                                    onClick={(data) => {
                                        if (data && data._id) {
                                            history.push(`/library/inventory?department=${encodeURIComponent(data._id)}`);
                                        }
                                    }}
                                >
                                    {data.deptDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" cursor="pointer" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '10px', maxHeight: '60px', overflowY: 'auto' }}>
                            {data.deptDist.map((entry, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></span>
                                    {entry._id || 'Uncategorized'} <span style={{ fontWeight: 600 }}>{entry.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryAnalytics;
