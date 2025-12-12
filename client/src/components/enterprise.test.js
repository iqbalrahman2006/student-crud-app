import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import ViewToggle from './ViewToggle';
import ConsolidatedDashboard from './ConsolidatedDashboard';
import BookInventory from './library/BookInventory';
import LibraryAnalytics from './library/LibraryAnalytics';
import { studentService } from '../services/studentService';
import { analyticsService } from '../services/analyticsService';
import { bookService } from '../services/bookService';

// Mock Services
jest.mock('../services/studentService');
jest.mock('../services/analyticsService');
jest.mock('../services/bookService');
import StudentList from './StudentList'; // Import StudentList directly for isolated testing

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('Enterprise Features - Phase 3', () => {

    test('StudentList toggles columns based on viewMode', () => {
        const students = [{ _id: '1', name: 'Michael Johnson', status: 'Active', department: 'CS' }];

        // Detailed Mode
        const detailed = render(<StudentList students={students} viewMode="detailed" />);
        expect(detailed.getByText('Email')).toBeInTheDocument();
        expect(detailed.getByText('GPA')).toBeInTheDocument();
        detailed.unmount();

        // Consolidated Mode
        const consolidated = render(<StudentList students={students} viewMode="consolidated" />);
        // Email and GPA should NOT be present
        expect(screen.queryByText('Email')).not.toBeInTheDocument();
        expect(screen.queryByText('GPA')).not.toBeInTheDocument();
        // Core fields SHOULD be present
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    // --- PART 1: TOGGLE ---
    test('ViewToggle renders and switches modes', () => {
        const setViewMode = jest.fn();
        render(<ViewToggle viewMode="detailed" setViewMode={setViewMode} />);

        expect(screen.getByText('📑 Detailed')).toHaveClass('active');

        fireEvent.click(screen.getByText('📊 Consolidated'));
        expect(setViewMode).toHaveBeenCalledWith('consolidated');
    });

    // --- PART 2: DASHBOARD METRICS ---
    test('ConsolidatedDashboard displays aggregated metrics', async () => {
        // Mock API responses
        studentService.getAll.mockResolvedValue({ data: { data: [{ _id: '1', status: 'Active', course: 'CS' }] } }); // Optional
        analyticsService.getInventorySummary.mockResolvedValue({
            data: { data: { totalCopies: 100, totalCheckedOut: 20, overdueCount: 5 } }
        });

        const mockStudents = [{ _id: '1', status: 'Active', course: 'CS' }];

        // Render with REQUIRED prop
        render(<ConsolidatedDashboard students={mockStudents} />);

        // Wait for Async Data (Library summary)
        await waitFor(() => {
            expect(screen.getByText('Total Students')).toBeInTheDocument();
            // Check Prop-Derived Metric
            expect(screen.getByText('1')).toBeInTheDocument(); // 1 Student
        }, { timeout: 10000 });

        // Check API-Derived Metric
        expect(screen.getByText('100')).toBeInTheDocument(); // 100 Books
    }, 10000);

    // --- PART 3: REDIRECTION ---
    test('LibraryAnalytics redirects to overdue on click', async () => {
        const history = createMemoryHistory();
        analyticsService.getInventorySummary.mockResolvedValue({ data: { data: { totalCopies: 100, overdueCount: 10 } } });
        analyticsService.getLibraryAnalytics.mockResolvedValue({ data: { data: { popularBooks: [] } } });

        render(
            <Router history={history}>
                <LibraryAnalytics />
            </Router>
        );

        await waitFor(() => screen.getByText('Overdue Books'));
        fireEvent.click(screen.getByText('Overdue Books').closest('.stat-card'));

        expect(history.location.pathname).toBe('/library/inventory');
        expect(history.location.search).toBe('?filter=overdue');
    });

    // --- PART 4: AVAILABILITY UI ---
    test('BookInventory renders availability badges', async () => {
        bookService.getAll.mockResolvedValue({
            data: {
                data: [
                    { _id: '1', title: 'Book A', availableCopies: 5, totalCopies: 10 }, // Available
                    { _id: '2', title: 'Book B', availableCopies: 0, totalCopies: 3 }   // Unavailable
                ]
            }
        });

        render(
            <Router history={createMemoryHistory()}>
                <BookInventory onEdit={() => { }} onIssue={() => { }} />
            </Router>
        );

        await waitFor(() => screen.findByText('Book A'));

        // Check for Available text
        expect(screen.getByText('Available')).toHaveClass('status-active');
        // Check for Unavailable text
        expect(screen.getByText('Unavailable')).toHaveClass('status-suspended');
    });

});
