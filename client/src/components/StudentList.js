import React from "react";
import StudentItem from "./StudentItem";

/**
 * StudentList Component
 * 
 * Renders the main data table for the student directory.
 * Handles the "Empty State" if no data is provided.
 */
function StudentList({ students, onEdit, onDelete, isLoading, density }) {
  if (!students || !students.length) return (
    <div className="table-container">
      <div style={{ padding: "60px", textAlign: "center", color: "var(--gray-text)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
        <h3>No students found</h3>
        <p>Try adjusting your search filters or add a new student.</p>
      </div>
    </div>
  );

  return (
    <div className="table-container">
      <table className="student-table">
        <thead className="sticky-header">
          <tr>
            <th width="20%">Name</th>
            <th width="20%">Email</th>
            <th width="15%">Course</th>
            <th width="10%">GPA</th>
            <th width="15%">Enrolled</th>
            <th width="10%">Status</th>
            <th width="10%">Actions</th>
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentList;
