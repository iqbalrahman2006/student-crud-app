import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Reports from './Reports';

describe('Reports Pivot Engine Tests', () => {

    // Mock Data
    const mockStudents = [
        { _id: '1', gpa: 3.5, status: 'Active', course: 'CS', country: 'USA' },
        { _id: '2', gpa: 4.0, status: 'Active', course: 'CS', country: 'UK' },
        { _id: '3', gpa: 2.5, status: 'Inactive', course: 'ME', country: 'USA' }
    ];

    test('renders standard Dashboard initially', () => {
        render(<Reports students={mockStudents} />);

        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/Average GPA/i)).toBeInTheDocument();
        // 3.5 + 4.0 + 2.5 = 10 / 3 = 3.33
        expect(screen.getByText('3.33')).toBeInTheDocument();
    });

    test('toggles to Pivot Engine view', () => {
        render(<Reports students={mockStudents} />);

        const pivotBtn = screen.getByText(/Open Pivot Engine/i);
        fireEvent.click(pivotBtn);

        expect(screen.getByText(/Pivot Analytics Engine/i)).toBeInTheDocument();
        expect(screen.getByText(/Drag & drop/i)).toBeInTheDocument(); // Corrected text match
    });

    test('shows empty state when no students', () => {
        render(<Reports students={[]} />);
        expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
    });
});
