import React from "react";
import StudentItem from "./StudentItem";
import { Table, Icon, Segment, Header } from "semantic-ui-react";

/**
 * StudentList Component
 * 
 * Renders the main data table for the student directory.
 * Handles the "Empty State" if no data is provided.
 */
function StudentList({ students, onEdit, onDelete, onViewActivity, isLoading, density, viewMode }) {
  if (!students || !students.length) return (
    <Segment placeholder basic>
      <Header icon>
        <Icon name='users' />
        No students found
        <Header.Subheader>Try adjusting your filters or add a new student.</Header.Subheader>
      </Header>
    </Segment>
  );

  const isConsolidated = viewMode === 'consolidated';

  return (
    <Segment basic style={{ padding: 0 }}>
      {/* We use unstackable to prevent breaking on mobile for data density */}
      <Table celled striped selectable unstackable color='violet' size={density === 'compact' ? 'small' : 'large'}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={isConsolidated ? 5 : 3}><Icon name='user' /> Name</Table.HeaderCell>
            {!isConsolidated && <Table.HeaderCell width={4}><Icon name='mail' /> Email</Table.HeaderCell>}
            <Table.HeaderCell width={isConsolidated ? 6 : 3}><Icon name='university' /> Department</Table.HeaderCell>
            {!isConsolidated && <Table.HeaderCell width={2}><Icon name='graduation cap' /> GPA</Table.HeaderCell>}
            {!isConsolidated && <Table.HeaderCell width={3} textAlign='center'><Icon name='book' /> Library Activity</Table.HeaderCell>}
            {!isConsolidated && <Table.HeaderCell width={2}><Icon name='clock' /> Last Active</Table.HeaderCell>}
            <Table.HeaderCell width={isConsolidated ? 5 : 2}><Icon name='info circle' /> Status</Table.HeaderCell>
            {!isConsolidated && <Table.HeaderCell width={2}>Actions</Table.HeaderCell>}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {students.map((s) => (
            <StudentItem
              key={s._id}
              student={s}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewActivity={onViewActivity}
              isLoading={isLoading}
              density={density}
              viewMode={viewMode}
            />
          ))}
        </Table.Body>
      </Table>
    </Segment>
  );
}

export default StudentList;
