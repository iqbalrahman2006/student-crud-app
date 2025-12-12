import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ConsolidatedDashboard = ({ students }) => { // Accept students prop
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch ONLY Library summary (students come from prop to ensure sync)
                const libraryRes = await analyticsService.getInventorySummary();
                const library = libraryRes.data.data || {};

                // Student Metrics (Derived from Single Source of Truth)
                const totalStudents = students.length;
                const activeStudents = students.filter(s => s.status === 'Active').length;

                // Library Metrics
                const totalBooks = library.totalCopies || 0;
                const borrowed = library.totalCheckedOut || 0;
                const overdue = library.overdueCount || 0;

                setMetrics({
                    totalStudents,
                    activeStudents,
                    totalBooks,
                    borrowed,
                    overdue,
                    deptDist: calculateDeptDist(students)
                });
            } catch (error) {
                console.error("Dashboard Load Failed", error);
            } finally {
                setLoading(false);
            }
        };

        if (students) fetchData();
    }, [students]); // Re-run when students change (e.g. after add/delete)

    const calculateDeptDist = (students) => {
        const counts = {};
        students.forEach(s => {
            const d = s.course || 'Unknown';
            counts[d] = (counts[d] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count })).slice(0, 5);
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading Enterprise Dashboard...</div>;
    if (!metrics) return <div style={{ padding: '20px', color: 'red' }}>Failed to load dashboard data.</div>;

    const Card = ({ title, value, sub, icon, color }) => (
        <div className="stat-card fade-in" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="stat-icon" style={{ background: `${color}20`, color: color }}>{icon}</div>
            <div className="stat-content">
                <div className="stat-title">{title}</div>
                <div className="stat-value" style={{ color: '#1e293b' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub}</div>
            </div>
        </div>
    );

    return (
        <div className="consolidated-dashboard fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px', marginBottom: '5px' }}>
                    🏫 University Command Center
                </h2>
                <p style={{ color: '#64748b', margin: 0 }}>Real-time aggregated view of Campus & Library operations.</p>
            </div>

            {/* METRICS GRID */}
            <div className="stats-grid">
                <Card
                    title="Total Students"
                    value={metrics.totalStudents}
                    sub={`${metrics.activeStudents} Active On-Campus`}
                    icon="🎓"
                    color="#4f46e5"
                />
                <Card
                    title="Library Holdings"
                    value={metrics.totalBooks}
                    sub={`${metrics.borrowed} currently borrowed`}
                    icon="📚"
                    color="#0ea5e9"
                />
                <Card
                    title="Overdue Alerts"
                    value={metrics.overdue}
                    sub="Requires attention"
                    icon="⚠️"
                    color="#ef4444"
                />
                <Card
                    title="Campus Health"
                    value="98%"
                    sub="System Operational"
                    icon="✅"
                    color="#10b981"
                />
            </div>

            {/* CHARTS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
                <div className="table-card" style={{ padding: '20px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#64748b' }}>Student Distribution (Top Depts)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.deptDist} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '11px' }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="table-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem', color: '#64748b' }}>Quick Actions</h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        <button className="button button-outline" style={{ justifyContent: 'center' }}>📥 Generate Weekly Report</button>
                        <button className="button button-outline" style={{ justifyContent: 'center' }}>✉️ Blast Email to All Active</button>
                        <button className="button button-outline" style={{ justifyContent: 'center' }}>🛡️ System Audit Log</button>
                    </div>
                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                        <strong>💡 Pro Tip:</strong> Switch to "Detailed Mode" (Top Right) for granular control over individual student records and book inventory management.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsolidatedDashboard;
