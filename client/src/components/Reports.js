import React, { useState, useMemo } from 'react';
import '../App.css';
import PivotEngine from './PivotEngine';

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
 * 2. True 2D Drag-and-Drop Pivot Engine
 * 3. Robust CSV parsing with try/catch
 */
const Reports = ({ students }) => {

    const [pivotMode, setPivotMode] = useState(false);
    const [csvData, setCsvData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                    GPA: s.gpa ? parseFloat(s.gpa) : 0,
                    Status: s.status,
                    Country: s.country,
                    City: s.city,
                    Transport: s.transportMode,
                    Category: s.studentCategory
                }));

                setCsvData(flatData);

            } catch (err) {
                console.error("System Data Load Error:", err);
                setError("Failed to load system data.");
            } finally {
                setLoading(false);
            }
        }, 500);
    };

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
                    /* === PIVOT ENGINE INTERFACE === */
                    <div className="pivot-interface fade-in">

                        {/* 1. UPLOAD ZONE (Only if no data loaded) */}
                        {csvData.length === 0 && (
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
                        )}

                        {/* 2. PIVOT ENGINE */}
                        {csvData.length > 0 && (
                            <PivotEngine data={csvData} />
                        )}

                        {csvData.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <button className="button button-edit" onClick={() => setCsvData([])}>↺ Reset Data</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ReportsErrorBoundary>
    );
};

export default Reports;

