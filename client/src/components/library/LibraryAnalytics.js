import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useHistory } from 'react-router-dom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const LibraryAnalytics = () => {
    const history = useHistory();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        let mounted = true;
        loadStats(mounted);
        return () => { mounted = false; };
    }, []);

    const handleNavigation = (path) => {
        if (isNavigating) return;
        setIsNavigating(true);
        // Small timeout to prevent immediate re-clicks
        setTimeout(() => setIsNavigating(false), 500);
        history.push(path);
    };

    const loadStats = async (isMounted = true) => {
        try {
            // PART 2: Use new Summary Endpoint for robust data
            const summaryRes = await analyticsService.getInventorySummary();
            const analyticsRes = await analyticsService.getLibraryAnalytics(); // Keep for charts

            if (!isMounted) return;

            // Merge Data
            const summary = summaryRes.data.data;
            const analytics = analyticsRes.data.data;

            setData({
                ...analytics,
                totalBooks: summary.totalDistinctBooks,
                totalAvailable: summary.totalAvailableCopies,
                totalCopies: summary.totalCopies,
                borrowedCount: analytics.borrowedToday, // Mapped to Borrowed Today Logic
                overdueCount: analytics.overdueCount,
                reservationQueue: analytics.reservationQueue
            });
        } catch (e) {
            console.error("Analytics Load Failed", e);
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Dashboard...</div>;
    if (!data) return <div>Error loading data.</div>;

    return (
        <div className="analytics-dashboard fade-in">
            {/* STAT CARDS */}
            <div className="stats-grid">
                <div className="stat-card" onClick={() => handleNavigation('/library/history?filter=today')}>
                    <div className="stat-icon icon-blue">📅</div>
                    <div className="stat-content">
                        <div className="stat-title">Borrowed Today</div>
                        <div className="stat-value">{data.borrowedCount}</div>
                        {data.borrowedCount === 0 && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>No activity recorded yet. Counters will update automatically when borrow actions occur.</div>}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon icon-green">✅</div>
                    <div className="stat-content">
                        <div className="stat-title">Available</div>
                        <div className="stat-value">{data.totalAvailable}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{data.totalCopies} Total Copies</div>
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
                >
                    <div className="stat-icon icon-orange">⚠️</div>
                    <div className="stat-content">
                        <div className="stat-title">Overdue Books</div>
                        <div className="stat-value" style={{ color: data.overdueCount > 0 ? '#ef4444' : 'inherit' }}>{data.overdueCount}</div>
                        {data.overdueCount === 0 && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>No activity recorded yet. Counters will update automatically when return actions occur.</div>}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon icon-purple">🕒</div>
                    <div className="stat-content">
                        <div className="stat-title">Reservations</div>
                        <div className="stat-value">{data.reservationQueue || 0}</div>
                        {(data.reservationQueue || 0) === 0 && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>No activity recorded yet.</div>}
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

                {/* POPULAR BOOKS - ENHANCED */}
                <div className="table-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>🏆 Top Borrowed Books</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Based on verified checkout frequency</p>
                    </div>

                    <div style={{ flex: 1, minHeight: '300px' }}>
                        {!data.popularBooks || data.popularBooks.length === 0 ? (
                            // FALLBACK VISUALIZATION (Pictograph)
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.6 }}>
                                <div style={{ fontSize: '2rem' }}>📚 📊 📉</div>
                                <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Not enough data to generate chart yet.</div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data.popularBooks}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                    onClick={(data) => {
                                        if (data && data.activePayload && data.activePayload[0]) {
                                            history.push(`/library/inventory?open=${data.activePayload[0].payload.title}`);
                                        }
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#818cf8" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="title"
                                        width={220}
                                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div style={{ background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{payload[0].payload.title}</div>
                                                        <div style={{ color: '#6366f1', fontSize: '0.8rem', marginTop: '4px' }}>
                                                            🔥 {payload[0].value} {payload[0].value === 1 ? 'Checkout' : 'Checkouts'}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="url(#barGradient)"
                                        radius={[0, 4, 4, 0]}
                                        barSize={24}
                                        cursor="pointer"
                                        animationDuration={1000}
                                    >
                                        {/* Label List could be added here if needed */}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* DEPARTMENT DISTRIBUTION */}
                <div className="table-card" style={{ padding: '20px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#64748b', textTransform: 'uppercase' }}>Holdings by Department</h3>
                    <div style={{ height: '350px', minHeight: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.deptDist || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="count"
                                    nameKey="_id"
                                    onClick={(data) => {
                                        if (data && data._id) {
                                            history.push(`/library/inventory?department=${encodeURIComponent(data._id)}`);
                                        }
                                    }}
                                >
                                    {(data.deptDist || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" cursor="pointer" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '10px', maxHeight: '60px', overflowY: 'auto' }}>
                            {(data.deptDist || []).map((entry, index) => (
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
