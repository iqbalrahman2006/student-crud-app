import React from 'react';
import { Table, Icon, Label, Button, Header } from 'semantic-ui-react';

const StudentItem = ({ student, onEdit, onDelete, onViewActivity, isLoading, density, viewMode }) => {
  if (!student) return null;
  const isConsolidated = viewMode === 'consolidated';

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return 'green';
      case "Inactive": return 'grey';
      case "Graduated": return 'blue';
      case "Suspended": return 'red';
      default: return 'yellow';
    }
  };

  return (
    <Table.Row>
      <Table.Cell>
        <Header as='h4' image>
          <Icon name='user circle' size='small' color='blue' />
          <Header.Content>
            {student.name}
            <Header.Subheader>{isConsolidated ? student.course : 'Student'}</Header.Subheader>
          </Header.Content>
        </Header>
      </Table.Cell>

      {!isConsolidated && <Table.Cell>{student.email}</Table.Cell>}

      <Table.Cell>
        {isConsolidated ? (
          <Label basic>{student.course}</Label>
        ) : (
          student.course || 'N/A'
        )}
      </Table.Cell>

      {!isConsolidated && <Table.Cell>{parseFloat(student.gpa || 0).toFixed(2)}</Table.Cell>}

      {!isConsolidated && (
        <Table.Cell textAlign='center'>
          {student.hasOverdue ? (
            <Label color='red' basic size='mini' style={{ cursor: 'pointer' }} onClick={() => onViewActivity && onViewActivity(student)}>
              <Icon name='warning' /> Overdue
            </Label>
          ) : student.borrowedBooksCount > 0 ? (
            <Label color='blue' basic size='mini' style={{ cursor: 'pointer' }} onClick={() => onViewActivity && onViewActivity(student)}>
              <Icon name='book' /> {student.borrowedBooksCount} Active
            </Label>
          ) : (
            <Icon name='minus' color='grey' disabled />
          )}
        </Table.Cell>
      )}

      {!isConsolidated && (
        <Table.Cell style={{ fontSize: '0.85rem', color: '#64748b' }}>
          {student.lastBorrowDate ? new Date(student.lastBorrowDate).toLocaleDateString() : '-'}
        </Table.Cell>
      )}

      <Table.Cell>
        <Label color={getStatusColor(student.status)} horizontal>
          {student.status}
        </Label>
      </Table.Cell>

      {!isConsolidated && (
        <Table.Cell>
          <Button.Group size='mini'>
            <Button icon='edit' basic color='blue' onClick={() => onEdit(student)} disabled={isLoading} />
            <Button icon='trash' basic color='red' onClick={() => onDelete(student)} disabled={isLoading} loading={isLoading} />
          </Button.Group>
        </Table.Cell>
      )}
    </Table.Row>
  );
};

export default StudentItem;
