import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import LibraryAnalytics from './LibraryAnalytics';
import * as api from '../../services/api';

// Mock API
jest.mock('../../services/api');
// Mock Recharts (Canvas context issue in JSDOM)
jest.mock('recharts', () => {
    const OriginalModule = jest.requireActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    };
});

const mockStats = {
    totalBooks: 100,
    borrowedToday: 15,
    overdueCount: 3,
    popularBooks: [{ title: 'Code Complete', count: 10 }],
    deptDist: [{ _id: 'CS', count: 50 }, { _id: 'Math', count: 50 }]
};

describe('LibraryAnalytics Component', () => {
    beforeEach(() => {
        api.getLibraryAnalytics.mockResolvedValue({ data: { data: mockStats } });
    });

    test('renders dashboard stats correctly', async () => {
        render(<LibraryAnalytics />);

        // Check Loading first
        expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();

        // Wait for data
        await waitFor(() => expect(screen.queryByText('Loading Dashboard...')).not.toBeInTheDocument());

        expect(screen.getByText('Total Books')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument(); // Count

        expect(screen.getByText('Borrowed Today')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();

        expect(screen.getByText('Overdue Books')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('renders chart sections', async () => {
        render(<LibraryAnalytics />);
        await waitFor(() => screen.findByText('Most Popular Books'));

        expect(screen.getByText('Holdings by Department')).toBeInTheDocument();
        // We mocked recharts, so we assume if text is there, the structure loaded.
    });
});
