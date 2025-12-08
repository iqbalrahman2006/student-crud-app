import React, { useState, useMemo } from 'react';
import '../App.css';

/**
 * REPORTS MODULE (ENTERPRISE EDITION)
 * 
 * Features:
 * 1. Live Analytics Dashboard (Zero Dependency)
 * 2. Client-Side Pivot Engine (CSV Upload -> Dynamic Pivot)
 * 3. Export Capabilities
 */
const Reports = ({ students }) => {

    const [pivotMode, setPivotMode] = useState(false);
    const [csvData, setCsvData] = useState([]);
    const [pivotConfig, setPivotConfig] = useState({ groupBy: '', value: 'count' }); // groupBy: colName, value: count/sum/avg

    // --- ANALYTICS ENGINE (Legacy + Enhanced) ---
    const stats = useMemo(() => {
        const total = students.length;
        if (total === 0) return null;

        const active = students.filter(s => s.status === 'Active').length;
        const inactive = students.filter(s => s.status === 'Inactive').length;
        const graduated = students.filter(s => s.status === 'Graduated').length;
        const suspended = students.filter(s => s.status === 'Suspended').length;

        // GPA Logic
        const gpas = students.map(s => parseFloat(s.gpa)).filter(n => !isNaN(n));
        const avgGpa = gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : "0.00";

        // Distribution
        const gpaDist = {
            '3.5 - 4.0': gpas.filter(g => g >= 3.5).length,
            '3.0 - 3.49': gpas.filter(g => g >= 3.0 && g < 3.5).length,
            '2.5 - 2.99': gpas.filter(g => g >= 2.5 && g < 3.0).length,
            '< 2.5': gpas.filter(g => g < 2.5).length,
        };

        // Course Popularity (Top 5)
        const courses = {};
        students.forEach(s => {
            const c = s.course || "Unassigned";
            courses[c] = (courses[c] || 0) + 1;
        });
        const topCourses = Object.entries(courses)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return { total, active, inactive, graduated, suspended, avgGpa, gpaDist, topCourses };
    }, [students]);

    // --- CSV PIVOT ENGINE ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 2) {
                alert("Invalid CSV: Need at least header and one row.");
                return;
            }

            const headers = lines[0].split(',').map(h => h.replace(/"/g, '')); // Basic parse
            const rows = lines.slice(1).map(line => {
                const values = line.split(','); // Simplified split (assumes no internal commas for safe mode)
                const obj = {};
                headers.forEach((h, i) => obj[h] = values[i] ? values[i].replace(/"/g, '') : '');
                return obj;
            });

            setCsvData(rows);
            // Default config
            if (headers.length > 0) {
                setPivotConfig({ groupBy: headers[0], value: 'count' });
            }
        };
        reader.readAsText(file);
    };

    const pivotTable = useMemo(() => {
        if (!csvData.length || !pivotConfig.groupBy) return null;

        const groups = {};
        csvData.forEach(row => {
            const key = row[pivotConfig.groupBy] || "Unknown";
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        });

        const results = Object.keys(groups).map(key => {
            const count = groups[key].length;
            return { label: key, count };
        });

        return results.sort((a, b) => b.count - a.count);
    }, [csvData, pivotConfig]);


    // --- CSV EXPORT ENGINE ---
    const downloadCSV = () => {
        const headers = ["ID", "Name", "Email", "Course", "GPA", "Status", "Enrollment Date", "City", "Country", "Transport"];
        const rows = students.map(s => [
            s._id,
            `"${s.name}"`,
            s.email,
            `"${s.course || ''}"`,
            s.gpa || '',
            s.status,
            s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : '',
            `"${s.city || ''}"`,
            `"${s.country || ''}"`,
            s.transportMode || 'Private'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `student_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!stats) return <div className="empty-state">No Data Available for Reports</div>;

    return (
        <div className="reports-container fade-in">
            <div className="report-header">
                <h2>{pivotMode ? "Pivot Analytics Engine" : "Analytics Dashboard"}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={`button ${pivotMode ? 'button-cancel' : 'button-edit'}`} onClick={() => setPivotMode(!pivotMode)}>
                        {pivotMode ? "← Back to Dashboard" : "📊 Open Pivot Engine"}
                    </button>
                    {!pivotMode && (
                        <button className="button button-download" onClick={downloadCSV}>
                            📥 Export All Data
                        </button>
                    )}
                </div>
            </div>

            {pivotMode ? (
                /* === PIVOT ENGINE UI === */
                <div className="pivot-view">
                    <div className="report-intro" style={{ marginBottom: '24px', padding: '16px', background: '#eef2ff', borderRadius: '8px', color: '#4338ca' }}>
                        <strong>✨ How to use the Pivot Engine:</strong>
                        <ol style={{ paddingLeft: '20px', marginTop: '8px' }}>
                            <li>Upload any standard CSV file (ensure headers are on the first row).</li>
                            <li>Use the controls to <strong>Group By</strong> specific fields (e.g., Country, Course).</li>
                            <li>Visualize the distribution and export the summarized data for external use.</li>
                        </ol>
                    </div>

                    <div className="drop-zone">
                        <h3 style={{ marginTop: 0 }}>📂 Upload External CSV</h3>
                        <p className="text-muted">Drag & drop or click to upload file for analysis.</p>
                        <input type="file" accept=".csv" onChange={handleFileUpload} style={{ marginTop: '10px' }} />
                    </div>

                    {csvData.length > 0 && (
                        <div className="pivot-workspace fade-in">
                            <div className="pivot-controls">
                                <div className="control-group">
                                    <label>Group Rows By:</label>
                                    <select
                                        className="setting-select"
                                        value={pivotConfig.groupBy}
                                        onChange={(e) => setPivotConfig(prev => ({ ...prev, groupBy: e.target.value }))}
                                    >
                                        {Object.keys(csvData[0]).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div className="control-group">
                                    <label>Aggregation:</label>
                                    <select className="setting-select" disabled>
                                        <option>Count of Records</option>
                                    </select>
                                </div>
                                <div className="control-group" style={{ display: 'flex', alignItems: 'end' }}>
                                    <span className="badge badge-success" style={{ padding: '10px 16px', fontSize: '0.9rem' }}>
                                        Total Records: {csvData.length}
                                    </span>
                                </div>
                            </div>

                            <div className="table-card">
                                <table className="student-table sticky-header">
                                    <thead>
                                        <tr>
                                            <th>{pivotConfig.groupBy}</th>
                                            <th>Record Count</th>
                                            <th>% Share</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pivotTable.map((row) => (
                                            <tr key={row.label}>
                                                <td>{row.label}</td>
                                                <td>{row.count}</td>
                                                <td>{((row.count / csvData.length) * 100).toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* === STANDARD DASHBOARD UI === */
                <>
                    {/* KEY METRICS CARDS */}
                    <div className="stats-cards-grid">
                        <div className="stat-card">
                            <div className="stat-label">Average GPA</div>
                            <div className="stat-value highlight">{stats.avgGpa}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Total Students</div>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Active Rate</div>
                            <div className="stat-value">
                                {((stats.active / stats.total) * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        {/* GPA DISTRIBUTION CHART */}
                        <div className="chart-card">
                            <h3>GPA Distribution</h3>
                            <div className="bar-chart">
                                {Object.entries(stats.gpaDist).map(([label, count]) => {
                                    const percent = (count / stats.total) * 100;
                                    return (
                                        <div key={label} className="chart-row">
                                            <span className="chart-label">{label}</span>
                                            <div className="bar-track">
                                                <div
                                                    className="bar-fill"
                                                    style={{ width: `${percent}%`, backgroundColor: `hsl(${percent * 2 + 150}, 70%, 50%)` }}
                                                ></div>
                                            </div>
                                            <span className="chart-value">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* COURSE ENROLLMENT CHART */}
                        <div className="chart-card">
                            <h3>Top Courses</h3>
                            <div className="bar-chart">
                                {stats.topCourses.map(([course, count]) => {
                                    const max = stats.topCourses[0][1];
                                    const percent = (count / max) * 100;
                                    return (
                                        <div key={course} className="chart-row">
                                            <span className="chart-label">{course}</span>
                                            <div className="bar-track">
                                                <div
                                                    className="bar-fill secondary"
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                            <span className="chart-value">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
