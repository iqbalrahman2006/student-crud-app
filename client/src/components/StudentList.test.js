// client/src/components/StudentList.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StudentList from './StudentList';

describe('StudentList Component', () => {

    const mockStudents = [
        { _id: '1', name: 'John Doe', email: 'john@example.com', course: 'CS', gpa: 3.5, status: 'Active' },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', course: 'Math', gpa: 4.0, status: 'Inactive' }
    ];

    const mockEdit = jest.fn();
    const mockDelete = jest.fn();

    test('renders empty state when no students provided', () => {
        render(<StudentList students={[]} />);
        expect(screen.getByText(/No students found/i)).toBeInTheDocument();
        expect(screen.getByText(/Try adjusting your search filters/i)).toBeInTheDocument();
    });

    test('renders table with student data', () => {
        render(<StudentList students={mockStudents} onEdit={mockEdit} onDelete={mockDelete} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('CS')).toBeInTheDocument();
        expect(screen.getByText('Math')).toBeInTheDocument();
    });

    test('triggers onEdit when Edit button clicked', () => {
        render(<StudentList students={mockStudents} onEdit={mockEdit} onDelete={mockDelete} />);

        // Use getAllByText since multiple rows exist. 
        // We click the first one.
        const firstRowEdit = screen.getAllByText("Edit")[0];
        fireEvent.click(firstRowEdit);

        expect(mockEdit).toHaveBeenCalledWith(mockStudents[0]);
    });

    test('triggers onDelete when Delete button clicked', () => {
        render(<StudentList students={mockStudents} onEdit={mockEdit} onDelete={mockDelete} />);

        const firstRowDelete = screen.getAllByText("Delete")[0];
        fireEvent.click(firstRowDelete);

        expect(mockDelete).toHaveBeenCalledWith(mockStudents[0]);
    });
});
