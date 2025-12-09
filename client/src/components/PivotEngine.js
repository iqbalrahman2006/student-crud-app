import React, { useState, useMemo, useEffect } from "react";
import "../App.css";

// Helper to aggregate data
export const aggregateData = (data, rows, cols, values, filters) => {
    if (!data || data.length === 0) return { matrix: {}, rowKeys: [], colKeys: [] };

    // 1. Filter Data
    let filteredData = data.filter(item => {
        return Object.keys(filters).every(key => {
            if (!filters[key] || filters[key] === "All") return true;
            return String(item[key]) === filters[key];
        });
    });

    // 2. Extract Unique Keys for Rows and Cols
    const getKeys = (d, fields) => {
        if (fields.length === 0) return ["Totals"];
        const keys = new Set();
        d.forEach(item => {
            const key = fields.map(f => item[f] || "(Blank)").join(" :: ");
            keys.add(key);
        });
        return Array.from(keys).sort();
    };

    const rowKeys = getKeys(filteredData, rows);
    const colKeys = getKeys(filteredData, cols);

    // 3. Build Matrix
    const matrix = {};
    filteredData.forEach(item => {
        const rowKey = rows.length > 0 ? rows.map(f => item[f] || "(Blank)").join(" :: ") : "Totals";
        const colKey = cols.length > 0 ? cols.map(f => item[f] || "(Blank)").join(" :: ") : "Totals";

        if (!matrix[rowKey]) matrix[rowKey] = {};
        if (!matrix[rowKey][colKey]) matrix[rowKey][colKey] = { count: 0, sum: 0, values: [] };

        matrix[rowKey][colKey].count += 1;
        // Simple sum for first value field if numeric
        if (values.length > 0) {
            const val = parseFloat(item[values[0]]);
            if (!isNaN(val)) matrix[rowKey][colKey].sum += val;
            matrix[rowKey][colKey].values.push(val);
        }
    });

    return { matrix, rowKeys, colKeys };
};

const PivotEngine = ({ data }) => {
    const allFields = Object.keys(data[0] || {}).map(k => ({ id: k, label: k.replace(/([A-Z])/g, ' $1').trim() }));

    // State for Drag and Drop Areas
    const [activeFields, setActiveFields] = useState({
        rows: [],
        cols: [],
        values: [],
        filters: []
    });

    // Filter Values State
    const [filterValues, setFilterValues] = useState({});

    // Calculations
    const { matrix, rowKeys, colKeys } = useMemo(() => {
        return aggregateData(data, activeFields.rows, activeFields.cols, activeFields.values, filterValues);
    }, [data, activeFields, filterValues]);

    // Drag Handlers
    const handleDragStart = (e, field, source) => {
        e.dataTransfer.setData("field", field);
        e.dataTransfer.setData("source", source);
    };

    const handleDrop = (e, targetArea) => {
        e.preventDefault();
        const fieldId = e.dataTransfer.getData("field");
        const sourceArea = e.dataTransfer.getData("source");

        if (!fieldId) return;

        // Logic: Move field from Source to Target
        setActiveFields(prev => {
            const newState = { ...prev };

            // Remove from source (if it was in a specific area, otherwise it's from 'all' list which is always available)
            if (sourceArea !== "all") {
                newState[sourceArea] = newState[sourceArea].filter(f => f !== fieldId);
            } else {
                // If from 'all', ensure it's not already in target to prevent duplicates if desirable, 
                // or allow moving. For simple pivot, usually fields are unique across active areas.
                // Let's remove from other areas to ensure uniqueness in usage
                ['rows', 'cols', 'values', 'filters'].forEach(area => {
                    newState[area] = newState[area].filter(f => f !== fieldId);
                });
            }

            // Add to target
            if (!newState[targetArea].includes(fieldId)) {
                newState[targetArea].push(fieldId);
            }

            return newState;
        });
    };

    const handleDragOver = (e) => e.preventDefault();

    const removeField = (area, field) => {
        setActiveFields(prev => ({
            ...prev,
            [area]: prev[area].filter(f => f !== field)
        }));
    };

    // Render Helper
    const DroppableArea = ({ title, areaKey, fields }) => (
        <div
            className="pivot-drop-area"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, areaKey)}
        >
            <div className="area-title">{title}</div>
            <div className="area-content">
                {fields.length === 0 && <span className="placeholder">Drop here</span>}
                {fields.map(f => (
                    <div
                        key={f}
                        className="pivot-field-chip"
                        draggable
                        onDragStart={(e) => handleDragStart(e, f, areaKey)}
                    >
                        {f} <span className="remove-x" onClick={() => removeField(areaKey, f)}>×</span>
                    </div>
                ))}
            </div>
        </div>
    );

    // Load Persistence
    useEffect(() => {
        const saved = localStorage.getItem('pivot_layout');
        if (saved) {
            try {
                setActiveFields(JSON.parse(saved));
            } catch (e) { console.error("Failed to load pivot layout", e); }
        }
    }, []);

    // Save Persistence
    useEffect(() => {
        if (activeFields.rows.length || activeFields.cols.length || activeFields.values.length) {
            localStorage.setItem('pivot_layout', JSON.stringify(activeFields));
        }
    }, [activeFields]);

    // CSV Export
    const exportCSV = () => {
        if (!rowKeys.length) return;
        let csv = [];
        // Header
        csv.push([`"${activeFields.rows.join(' / ')} \\ ${activeFields.cols.join(' / ')}"`, ...colKeys, "Total"].join(","));
        // Rows
        rowKeys.forEach(r => {
            const rowTotal = colKeys.reduce((acc, c) => acc + (matrix[r][c] ? (activeFields.values.length > 0 ? matrix[r][c].sum : matrix[r][c].count) : 0), 0);
            const rowStr = [
                `"${r}"`,
                ...colKeys.map(c => matrix[r][c] ? (activeFields.values.length > 0 ? matrix[r][c].sum : matrix[r][c].count) : ""),
                rowTotal
            ].join(",");
            csv.push(rowStr);
        });

        const blob = new Blob([csv.join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pivot_report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <div className="pivot-engine-container">
            {/* 1. Fields Panel */}
            <div className="fields-panel">
                <h4>Available Fields</h4>
                <div style={{ marginBottom: '10px' }}>
                    <button className="button button-sm" style={{ fontSize: '0.75rem', padding: '4px 8px', width: '100%' }} onClick={exportCSV}>
                        📄 Export CSV
                    </button>
                </div>
                <div className="fields-list">
                    {allFields.map(field => (
                        <div
                            key={field.id}
                            className="field-item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, field.id, "all")}
                        >
                            {field.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Configuration & View Panel */}
            <div className="pivot-workspace">
                {/* Drop Zones */}
                <div className="drop-zones-grid">
                    <DroppableArea title="Filters" areaKey="filters" fields={activeFields.filters} />
                    <DroppableArea title="Columns" areaKey="cols" fields={activeFields.cols} />
                    <DroppableArea title="Rows" areaKey="rows" fields={activeFields.rows} />
                    <DroppableArea title="Values (Σ)" areaKey="values" fields={activeFields.values} />
                </div>

                {/* Filters Selectors */}
                {activeFields.filters.length > 0 && (
                    <div className="active-filters-bar">
                        {activeFields.filters.map(filterField => (
                            <div key={filterField} className="filter-control">
                                <label>{filterField}:</label>
                                <select
                                    onChange={(e) => setFilterValues({ ...filterValues, [filterField]: e.target.value })}
                                    value={filterValues[filterField] || "All"}
                                >
                                    <option value="All">All</option>
                                    {[...new Set(data.map(d => d[filterField]))].sort().map(val => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pivot Table */}
                <div className="pivot-results">
                    {rowKeys.length > 0 ? (
                        <table className="pivot-table">
                            <thead>
                                <tr>
                                    <th className="corner-th">{activeFields.rows.join(" / ")} \ {activeFields.cols.join(" / ")}</th>
                                    {colKeys.map(col => <th key={col}>{col}</th>)}
                                    <th className="total-th">Grand Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rowKeys.map(row => {
                                    let rowSum = 0;
                                    return (
                                        <tr key={row}>
                                            <td className="row-header">{row}</td>
                                            {colKeys.map(col => {
                                                const cell = matrix[row][col];
                                                const val = cell ? (activeFields.values.length > 0 ? cell.sum : cell.count) : 0;
                                                if (typeof val === 'number') rowSum += val;
                                                return <td key={col}>{val || "-"}</td>;
                                            })}
                                            <td className="row-total">{rowSum}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-pivot-state">
                            <p>Drag fields to Rows and Columns to generate report.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PivotEngine;
