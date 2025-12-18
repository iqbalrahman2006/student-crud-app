import React from 'react';
import { Table, Icon, Button, Header, Popup } from 'semantic-ui-react';

const StudentItem = ({ student, onEdit, onDelete, onViewActivity, isLoading, density, viewMode }) => {
  if (!student) return null;
  const isConsolidated = viewMode === 'consolidated';

  const getStatusClass = (status) => {
    switch (status) {
      case "Active": return 'status-active';
      case "Inactive": return 'status-inactive';
      case "Graduated": return 'status-graduated';
      case "Suspended": return 'status-suspended';
      default: return 'status-inactive';
    }
  };

  return (
    <Table.Row className="student-row">
      <Table.Cell>
        <Header as='h4' image>
          <div className="avatar" style={{ marginRight: '12px' }}>
            {student.name.charAt(0).toUpperCase()}
          </div>
          <Header.Content>
            {student.name}
            <Header.Subheader style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {isConsolidated ? student.course : 'Student'}
            </Header.Subheader>
          </Header.Content>
        </Header>
      </Table.Cell>

      {!isConsolidated && <Table.Cell style={{ color: '#64748b' }}>{student.email}</Table.Cell>}

      <Table.Cell>
        {isConsolidated ? (
          <span className="course-tag">{student.course}</span>
        ) : (
          student.course || 'N/A'
        )}
      </Table.Cell>

      {!isConsolidated && <Table.Cell style={{ fontWeight: 600 }}>{parseFloat(student.gpa || 0).toFixed(2)}</Table.Cell>}

      {!isConsolidated && (
        <Table.Cell textAlign='center'>
          {student.hasOverdue ? (
            <span
              className="status-badge status-suspended"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => onViewActivity && onViewActivity(student, 'overdue')}
              title="View Overdue Books"
            >
              <Icon name='warning' /> Overdue
            </span>
          ) : student.borrowedBooksCount > 0 ? (
            <span
              className="status-badge status-active"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => onViewActivity && onViewActivity(student, 'active')}
              title="View Borrowed Books"
            >
              <Icon name='book' /> {student.borrowedBooksCount} Active
            </span>
          ) : (
            <span style={{ color: '#cbd5e1' }}>-</span>
          )}
        </Table.Cell>
      )}

      {!isConsolidated && (
        <Table.Cell style={{ fontSize: '0.85rem', color: '#64748b' }}>
          {student.lastBorrowDate ? new Date(student.lastBorrowDate).toLocaleDateString() : '-'}
        </Table.Cell>
      )}

      <Table.Cell>
        <span className={`status-badge ${getStatusClass(student.status)}`}>
          {student.status}
        </span>
      </Table.Cell>

      {!isConsolidated && (
        <Table.Cell>
          <Button.Group size='mini' basic>
            <Popup
              content='Edit Student Details'
              trigger={
                <Button icon='edit' className="action-btn" onClick={() => onEdit(student)} disabled={isLoading} />
              }
            />
            <Popup
              content='Delete Student Record'
              trigger={
                <Button icon='trash' className="action-btn delete" color='red' onClick={() => onDelete(student._id)} disabled={isLoading} loading={isLoading} />
              }
            />
          </Button.Group>
        </Table.Cell>
      )}
    </Table.Row>
  );
};

export default StudentItem;
