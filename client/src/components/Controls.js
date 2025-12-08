import React from 'react';
import '../App.css';

/**
 * Controls Component (ENHANCED)
 * 
 * Wrapper for the 'Controls Bar' within the workspace.
 * Contains Search Input, Sort/Filter Dropdowns, and Add Student Button.
 */
const Controls = ({ search, setSearch, onAddClick, sortBy, setSortBy, filterStatus, setFilterStatus, filterCourse, setFilterCourse, students }) => {
    // Extract unique courses from students for filter dropdown
    const uniqueCourses = React.useMemo(() => {
        const courses = students.map(s => s.course).filter(Boolean);
        return [...new Set(courses)].sort();
    }, [students]);

    return (
        <div className="controls-bar">
            <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Search students by name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                    aria-label="Search Students"
                />
            </div>

            {/* NEW: Sort Dropdown */}
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
                aria-label="Sort Students"
            >
                <option value="">Sort By...</option>
                <option value="name">Name (A-Z)</option>
                <option value="gpa-desc">GPA (High to Low)</option>
                <option value="gpa-asc">GPA (Low to High)</option>
                <option value="status">Status</option>
                <option value="course">Course</option>
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
            </select>

            {/* NEW: Status Filter */}
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
                aria-label="Filter by Status"
            >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Graduated">Graduated</option>
                <option value="Suspended">Suspended</option>
            </select>

            {/* NEW: Course Filter */}
            <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="filter-select"
                aria-label="Filter by Course"
            >
                <option value="">All Courses</option>
                {uniqueCourses.map(course => (
                    <option key={course} value={course}>{course}</option>
                ))}
            </select>

            <button
                className="add-btn"
                onClick={onAddClick}
                aria-label="Add New Student"
            >
                <div className="btn-content">
                    <span className="btn-icon">+</span>
                    <span>Add Student</span>
                </div>
            </button>
        </div>
    );
};

export default Controls;
