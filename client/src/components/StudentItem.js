import React from 'react';

const StudentItem = ({ student, onEdit, onDelete, isLoading, density }) => {
  if (!student) return null;

  const getStatusBadge = (status) => {
    let className = "status-badge ";
    switch (status) {
      case "Active": className += "status-active"; break;
      case "Inactive": className += "status-inactive"; break;
      case "Graduated": className += "status-graduated"; break;
      case "Suspended": className += "status-suspended"; break;
      default: className += "status-default";
    }
    return <span className={className}>{status}</span>;
  };



  return (
    <tr className={`student-row ${density ? `density-${density}` : ''}`}>
      <td className="name-cell">{student.name}</td>
      <td>{student.email}</td>
      <td>{student.course || 'N/A'}</td>
      <td>{parseFloat(student.gpa || 0).toFixed(2)}</td>
      <td>{new Date(student.enrollmentDate).toLocaleDateString()}</td>
      <td>
        <span className={getStatusBadge(student.status)}>
          {student.status}
        </span>
      </td>
      <td>
        <div className="action-buttons">
          <button
            className="button button-edit"
            onClick={() => onEdit(student)}
            disabled={isLoading}
          >
            Edit
          </button>
          <button
            className="button button-delete"
            onClick={() => onDelete(student)}
            disabled={isLoading}
          >
            {isLoading ? "..." : "Delete"}
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StudentItem;
