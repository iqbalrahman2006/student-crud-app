import React, { useState, useMemo } from 'react';
import '../App.css';

/**
 * ERROR BOUNDARY
 * Prevents blank screen crashes within the Reports tab.
 */
class ReportsErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-state fade-in" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
                    <h2>⚠️ Reports Engine Encountered an Error</h2>
                    <p>{this.state.error?.message || "Unknown error occurred."}</p>
                    <button className="button button-edit" onClick={() => window.location.reload()}>Reload Application</button>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * REPORTS MODULE (ENTERPRISE EDITION 2.0)
 * Features:
 * 1. Live Analytics Dashboard (Defaults)
 * 2. True 2D Pivot Engine (Rows x Cols x Values)
 * 3. Robust CSV parsing with try/catch
 */
const Reports = ({ students }) => {

    const [pivotMode, setPivotMode] = useState(false);
    const [csvData, setCsvData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pivotConfig, setPivotConfig] = useState({
        rowGroup: '',
        colGroup: '',
        valueField: '',
        aggregation: 'count'
    });

    // --- ANALYTICS DASHBOARD (Legacy View) ---
    const stats = useMemo(() => {
        if (!students || students.length === 0) return null;
        const total = students.length;
        const active = students.filter(s => s.status === 'Active').length;

        // GPA Safe Calc
        const gpas = students.map(s => parseFloat(s.gpa)).filter(n => !isNaN(n));
        const avgGpa = gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : "0.00";

        // Top Course
        const courses = {};
        students.forEach(s => {
            const c = s.course || "Unknown";
            courses[c] = (courses[c] || 0) + 1;
        });
        const topCourse = Object.entries(courses).sort((a, b) => b[1] - a[1])[0];

        return { total, active, avgGpa, topCourse: topCourse ? topCourse[0] : 'N/A' };
    }, [students]);

    // --- CSV PARSING ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target.result;
                const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length < 2) throw new Error("CSV must have header and at least one data row.");

                const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
                const rows = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const obj = {};
                    headers.forEach((h, i) => {
                        obj[h] = values[i] ? values[i].replace(/"/g, '').trim() : '';
                    });
                    return obj;
                });

                if (rows.length === 0) throw new Error("Parsed CSV is empty.");

                setCsvData(rows);
                // Smart Defaults
                setPivotConfig({
                    rowGroup: headers[0],
                    colGroup: headers[1] || headers[0],
                    valueField: headers[2] || headers[0],
                    aggregation: 'count'
                });
            } catch (err) {
                console.error("CSV Error:", err);
                setError(err.message || "Failed to process CSV.");
            } finally {
                setLoading(false);
            }
        };
        setTimeout(() => reader.readAsText(file), 500); // Simulate processing
    };

    // --- LOAD SYSTEM DATA ---
    const loadSystemData = () => {
        if (!students || students.length === 0) {
            setError("No system data available to load.");
            return;
        }

        setLoading(true);
        setError(null);

        // Simulate async processing for UX
        setTimeout(() => {
            try {
                const flatData = students.map(s => ({
                    Name: s.name,
                    Email: s.email,
                    Course: s.course,
                    GPA: s.gpa ? s.gpa.toString() : "0",
                    Status: s.status,
                    Country: s.country,
                    City: s.city,
                    Transport: s.transportMode,
                    Category: s.studentCategory
                }));

                setCsvData(flatData);

                // Smart Defaults
                setPivotConfig({
                    rowGroup: 'Course',
                    colGroup: 'Status',
                    valueField: 'GPA',
                    aggregation: 'avg'
                });

            } catch (err) {
                console.error("System Data Load Error:", err);
                setError("Failed to load system data.");
            } finally {
                setLoading(false);
            }
        }, 500);
    };

    // --- 2D PIVOT ENGINE ---
    const pivotMatrix = useMemo(() => {
        if (!csvData.length || !pivotConfig.rowGroup) return null;

        try {
            // 1. Extract Unique Keys
            const rowKeys = [...new Set(csvData.map(r => r[pivotConfig.rowGroup] || "Unknown"))].sort();
            const colKeys = pivotConfig.colGroup
                ? [...new Set(csvData.map(r => r[pivotConfig.colGroup] || "Unknown"))].sort()
                : ["Total"]; // Fallback if no col group selected

            // 2. Build Matrix
            const matrix = {};
            rowKeys.forEach(rKey => {
                matrix[rKey] = {};
                colKeys.forEach(cKey => {
                    // Find matching rows
                    const matches = csvData.filter(d =>
                        (d[pivotConfig.rowGroup] || "Unknown") === rKey &&
                        (!pivotConfig.colGroup || (d[pivotConfig.colGroup] || "Unknown") === cKey)
                    );

                    let val = 0;
                    if (pivotConfig.aggregation === 'count') {
                        val = matches.length;
                    } else if (pivotConfig.aggregation === 'sum') {
                        val = matches.reduce((sum, start) => sum + (parseFloat(start[pivotConfig.valueField]) || 0), 0);
                    } else if (pivotConfig.aggregation === 'avg') {
                        const total = matches.reduce((sum, start) => sum + (parseFloat(start[pivotConfig.valueField]) || 0), 0);
                        val = matches.length ? (total / matches.length) : 0;
                    }

                    // Format
                    if (!Number.isInteger(val)) val = parseFloat(val.toFixed(2));
                    matrix[rKey][cKey] = val;
                });
            });

            return { rowKeys, colKeys, matrix };
        } catch (e) {
            console.error("Matrix Calc Error", e);
            return null;
        }
    }, [csvData, pivotConfig]);


    return (
        <ReportsErrorBoundary>
            <div className="reports-container fade-in">
                {/* HEADLINE */}
                <div className="report-header">
                    <h2>{pivotMode ? "Pivot Analytics Engine" : "Executive Dashboard"}</h2>
                    <button
                        className={`button ${pivotMode ? 'button-cancel' : 'button-edit'}`}
                        onClick={() => setPivotMode(!pivotMode)}
                    >
                        {pivotMode ? "← Back to Summary" : "📊 Launch Pivot Engine"}
                    </button>
                </div>

                {/* LOGIC SWITCH */}
                {!pivotMode ? (
                    /* === DASHBOARD === */
                    <div className="dashboard-grid">
                        {stats ? (
                            <div className="stats-cards-grid">
                                <div className="stat-card">
                                    <div className="stat-label">Total Students</div>
                                    <div className="stat-value">{stats.total}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Active Users</div>
                                    <div className="stat-value">{stats.active}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Average GPA</div>
                                    <div className="stat-value highlight">{stats.avgGpa}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Top Course</div>
                                    <div className="stat-value" style={{ fontSize: '1.2rem' }}>{stats.topCourse}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">No Student Records Found. Add data to see analytics.</div>
                        )}
                        <div className="chart-card fade-in" style={{ marginTop: '20px', padding: '40px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                            <p style={{ color: '#64748b' }}>Use the <strong>Pivot Engine</strong> for deep-dive analysis on CSV reports.</p>
                        </div>
                    </div>
                ) : (
                    /* === PIVOT ENGINE === */
                    <div className="pivot-interface fade-in">

                        {/* 1. UPLOAD ZONE */}
                        <div className="drop-zone pivot-uploader">
                            <h3>📂 Data Import</h3>
                            <p>Upload CSV file OR load current system database.</p>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '15px 0' }}>
                                <button className="button button-submit" onClick={loadSystemData}>
                                    📥 Load System Data ({students?.length || 0} Records)
                                </button>
                            </div>

                            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>— OR —</p>

                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="file-input"
                            />
                            {loading && <div className="spinner">Processing Matrix...</div>}
                            {error && <div className="error-badge">⚠️ {error}</div>}
                        </div>

                        {/* 2. CONFIG BAR */}
                        {csvData.length > 0 && (
                            <div className="pivot-controls-bar fade-in">
                                <div className="control-group">
                                    <label>Row Group</label>
                                    <select value={pivotConfig.rowGroup} onChange={(e) => setPivotConfig({ ...pivotConfig, rowGroup: e.target.value })}>
                                        {Object.keys(csvData[0]).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div className="control-group">
                                    <label>Column Group</label>
                                    <select value={pivotConfig.colGroup} onChange={(e) => setPivotConfig({ ...pivotConfig, colGroup: e.target.value })}>
                                        <option value="">(None)</option>
                                        {Object.keys(csvData[0]).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div className="control-group">
                                    <label>Values</label>
                                    <select value={pivotConfig.valueField} onChange={(e) => setPivotConfig({ ...pivotConfig, valueField: e.target.value })}>
                                        {Object.keys(csvData[0]).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div className="control-group">
                                    <label>Aggregation</label>
                                    <select value={pivotConfig.aggregation} onChange={(e) => setPivotConfig({ ...pivotConfig, aggregation: e.target.value })}>
                                        <option value="count">Count</option>
                                        <option value="sum">Sum</option>
                                        <option value="avg">Average</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* 3. MATRIX GRID */}
                        {pivotMatrix && (
                            <div className="pivot-results table-card fade-in">
                                <table className="student-table sticky-header">
                                    <thead>
                                        <tr>
                                            <th>{pivotConfig.rowGroup} \ {pivotConfig.colGroup || "Metric"}</th>
                                            {pivotMatrix.colKeys.map(c => <th key={c}>{c}</th>)}
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pivotMatrix.rowKeys.map(rKey => {
                                            const rowTotal = pivotMatrix.colKeys.reduce((acc, cKey) => acc + (pivotMatrix.matrix[rKey][cKey] || 0), 0);
                                            return (
                                                <tr key={rKey}>
                                                    <td style={{ fontWeight: 600 }}>{rKey}</td>
                                                    {pivotMatrix.colKeys.map(cKey => (
                                                        <td key={`${rKey}-${cKey}`}>
                                                            {pivotMatrix.matrix[rKey][cKey] || '-'}
                                                        </td>
                                                    ))}
                                                    <td style={{ fontWeight: 600, background: '#f8fafc' }}>{Number.isInteger(rowTotal) ? rowTotal : rowTotal.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!loading && !csvData.length && (
                            <div className="empty-pivot-hint">
                                <span style={{ fontSize: '3rem' }}>📊</span>
                                <p>Waiting for data...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ReportsErrorBoundary>
    );
};

export default Reports;
