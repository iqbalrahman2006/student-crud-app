import React from 'react';

const StudentItem = ({ student, onEdit, onDelete, isLoading, density, viewMode }) => {
  if (!student) return null;
  const isConsolidated = viewMode === 'consolidated';

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
      <td className="name-cell">
        {student.name}
        {/* In Detailed mode, showing basic info in one cell is cleaner if we have many columns, but per request we keep detailed separate */}
      </td>

      {!isConsolidated && <td>{student.email}</td>}

      <td>{student.course || 'N/A'}</td>

      {!isConsolidated && <td>{parseFloat(student.gpa || 0).toFixed(2)}</td>}
      {!isConsolidated && <td style={{ textAlign: 'center' }}>{student.borrowedBooksCount || 0}</td>}
      {!isConsolidated && (
        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {student.lastBorrowDate ? new Date(student.lastBorrowDate).toLocaleDateString() : '—'}
        </td>
      )}

      <td>
        <span className={getStatusBadge(student.status)}>
          {student.status}
        </span>
      </td>

      {!isConsolidated && (
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
      )}
    </tr>
  );
};

export default StudentItem;
