import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LibraryAnalytics from './LibraryAnalytics';
import { analyticsService } from '../../services/analyticsService';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';

jest.mock('../../services/analyticsService');
// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('LibraryAnalytics - Popular Books Chart', () => {

    beforeEach(() => {
        analyticsService.getInventorySummary.mockResolvedValue({
            data: { data: { totalCopies: 100, totalDistinctBooks: 50, totalAvailableCopies: 80, totalCheckedOut: 20 } }
        });
    });

    test('Renders chart when data exists', async () => {
        analyticsService.getLibraryAnalytics.mockResolvedValue({
            data: {
                data: {
                    popularBooks: [
                        { title: 'The Hobbit', count: 12 },
                        { title: 'Dune', count: 8 }
                    ],
                    deptDist: []
                }
            }
        });

        const history = createMemoryHistory();
        render(
            <Router history={history}>
                <LibraryAnalytics />
            </Router>
        );

        await waitFor(() => screen.getByText('🏆 Top Borrowed Books'));
        expect(screen.getByText('Based on verified checkout frequency')).toBeInTheDocument();
        // Since Recharts renders SVG, we check for presence of bar segments or text
        // But simplified check: chart container exists
        expect(screen.queryByText('Not enough data to generate chart yet.')).not.toBeInTheDocument();
    });

    test('Renders fallback when data is empty', async () => {
        analyticsService.getLibraryAnalytics.mockResolvedValue({
            data: {
                data: {
                    popularBooks: [], // Empty
                    deptDist: []
                }
            }
        });

        const history = createMemoryHistory();
        render(
            <Router history={history}>
                <LibraryAnalytics />
            </Router>
        );

        await waitFor(() => screen.getByText('🏆 Top Borrowed Books'));
        expect(screen.getByText('Not enough data to generate chart yet.')).toBeInTheDocument();
        expect(screen.getByText('📚 📊 📉')).toBeInTheDocument();
    });
});
