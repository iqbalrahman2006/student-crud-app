import React from "react";
import StudentItem from "./StudentItem";

/**
 * StudentList Component
 * 
 * Renders the main data table for the student directory.
 * Handles the "Empty State" if no data is provided.
 */
function StudentList({ students, onEdit, onDelete, isLoading, density, viewMode }) {
  if (!students || !students.length) return (
    <div className="table-container">
      <div style={{ padding: "60px", textAlign: "center", color: "var(--gray-text)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
        <h3>No students found</h3>
        <p>Try adjusting your search filters or add a new student.</p>
      </div>
    </div>
  );

  const isConsolidated = viewMode === 'consolidated';

  return (
    <div className="table-container" style={{ overflowX: isConsolidated ? 'hidden' : 'auto' }}>
      <table className="student-table" style={{ width: isConsolidated ? '100%' : '1200px' /* Force scroll width for detailed */ }}>
        <thead className="sticky-header">
          <tr>
            <th width={isConsolidated ? "30%" : "15%"}>Name</th>
            {!isConsolidated && <th width="20%">Email</th>}
            <th width={isConsolidated ? "40%" : "15%"}>Department</th>
            {!isConsolidated && <th width="10%">GPA</th>}
            {!isConsolidated && <th width="10%">Borrowed</th>}
            {!isConsolidated && <th width="15%">Last Active</th>}
            <th width={isConsolidated ? "30%" : "10%"}>Status</th>
            {!isConsolidated && <th width="10%">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <StudentItem
              key={s._id}
              student={s}
              onEdit={onEdit}
              onDelete={onDelete}
              isLoading={isLoading}
              density={density}
              viewMode={viewMode} // Pass to Item
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentList;
