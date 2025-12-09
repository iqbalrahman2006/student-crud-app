import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import TransactionHistory from './TransactionHistory';
import * as api from '../../services/api';

jest.mock('../../services/api');

const mockTxns = [
    {
        _id: 't1',
        book: { title: 'Clean Code' },
        student: { name: 'John Doe', email: 'john@test.com' },
        issueDate: '2023-01-01',
        dueDate: '2023-01-15',
        status: 'Issued',
        fine: 0
    },
    {
        _id: 't2',
        book: { title: 'Legacy Code' },
        student: { name: 'Jane Doe', email: 'jane@test.com' },
        issueDate: '2023-01-01',
        dueDate: '2023-01-05',
        status: 'Issued',
        fine: 10 // Overdue fine
    }
];

describe('TransactionHistory Component', () => {
    beforeEach(() => {
        api.getTransactions.mockResolvedValue({ data: { data: mockTxns } });
    });

    test('renders history table with data', async () => {
        render(<TransactionHistory isActiveView={true} />);

        expect(await screen.findByText('Clean Code')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Legacy Code')).toBeInTheDocument();
    });

    test('highlights overdue books', async () => {
        // We test this by checking style or specific text if we added visual indicators
        // The component adds '⚠ OVERDUE' text for overdue items logic
        // We mock Date to ensuring comparison logic works, or rely on the mock data providing a very old date.
        // In mockTxns, '2023-01-05' is definitely in the past relative to now (2025).

        render(<TransactionHistory isActiveView={true} />);
        await screen.findByText('Clean Code');

        // Should show overdue warning for the second book
        // Note: The component logic: const isOverdue = new Date() > new Date(t.dueDate);
        // Since test env date is 2025, 2023 due date is overdue.
        const warnings = await screen.findAllByText(/OVERDUE/i);
        expect(warnings.length).toBeGreaterThan(0);
    });

    test('calls return API on button click', async () => {
        api.returnBook.mockResolvedValue({});
        window.confirm = jest.fn(() => true); // Mock confirm

        render(<TransactionHistory isActiveView={true} />);
        await screen.findByText('Clean Code');

        const returnButtons = screen.getAllByText('Return');
        fireEvent.click(returnButtons[0]);

        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => expect(api.returnBook).toHaveBeenCalledWith({ transactionId: 't1' }));
    });
});
