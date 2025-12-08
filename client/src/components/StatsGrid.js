import React from 'react';
import '../App.css';

/**
 * StatsGrid Component
 * 
 * Displays key performance indicators (KPIs) in a responsive grid layout.
 * Calculates metrics derived from the 'students' data array.
 */
const StatsGrid = ({ students }) => {

    // Robust Metric Calculation
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'Active').length;

    const validGPAs = students
        .map(s => parseFloat(s.gpa))
        .filter(gpa => !isNaN(gpa));

    const averageGPA = validGPAs.length > 0
        ? (validGPAs.reduce((a, b) => a + b, 0) / validGPAs.length).toFixed(2)
        : "N/A";

    return (
        <div className="stats-grid">
            {/* Total Students Card */}
            <div className="stat-card">
                <div className="stat-icon icon-blue">
                    👥
                </div>
                <div className="stat-content">
                    <div className="stat-title">Total Students</div>
                    <div className="stat-value">{totalStudents}</div>
                    <div className="stat-trend trend-neutral">
                        <span>Total Records</span>
                    </div>
                </div>
            </div>

            {/* Active Students Card */}
            <div className="stat-card">
                <div className="stat-icon icon-green">
                    ✅
                </div>
                <div className="stat-content">
                    <div className="stat-title">Active Status</div>
                    <div className="stat-value">{activeStudents}</div>
                    <div className="stat-trend trend-up">
                        <span>Currently Enrolled</span>
                    </div>
                </div>
            </div>

            {/* Average GPA Card */}
            <div className="stat-card">
                <div className="stat-icon icon-orange">
                    🎓
                </div>
                <div className="stat-content">
                    <div className="stat-title">Average GPA</div>
                    <div className="stat-value">{averageGPA}</div>
                    <div className="stat-trend trend-neutral">
                        <span>Academic Performance</span>
                    </div>
                </div>
            </div>

            {/* System Health Card (Mock) */}
            <div className="stat-card">
                <div className="stat-icon icon-purple">
                    ⚡
                </div>
                <div className="stat-content">
                    <div className="stat-title">System Health</div>
                    <div className="stat-value">100%</div>
                    <div className="stat-trend trend-up">
                        <span>All Systems Operational</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsGrid;
