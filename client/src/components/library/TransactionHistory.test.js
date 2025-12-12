import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import TransactionHistory from './TransactionHistory';
import { bookService } from '../../services/bookService';

jest.mock('../../services/bookService');

const mockTxns = [
    {
        _id: 't1',
        bookId: { title: 'Clean Code' },
        studentId: { name: 'John Doe', email: 'john@test.com' },
        issuedAt: '2023-01-01',
        dueDate: '2023-01-15',
        status: 'BORROWED',
        fineAmount: 0 // Renamed fine -> fineAmount to match schema
    },
    {
        _id: 't2',
        bookId: { title: 'Legacy Code' },
        studentId: { name: 'Jane Doe', email: 'jane@test.com' },
        issuedAt: '2023-01-01',
        dueDate: '2023-01-05',
        status: 'BORROWED',
        fineAmount: 10
    }
];

describe('TransactionHistory Component', () => {
    beforeEach(() => {
        bookService.getTransactions.mockResolvedValue({ data: { data: mockTxns } });
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

        // Should show overdue warning (Red color on Due Date)
        // Find the Due Date cell for the overdue item (2023-01-05)
        // Should show overdue warning (Red color on Due Date)
        // Find ALL cells with 2023 (Issue and Due dates)
        const dateCells = screen.getAllByText(/2023/);

        // Find the one with red color
        const overdueCell = dateCells.find(cell => {
            const style = window.getComputedStyle(cell.closest('td') || cell);
            return style.color === 'rgb(239, 68, 68)' || style.color === '#ef4444';
        });

        expect(overdueCell).toBeDefined();
    });

    test('calls return API on button click', async () => {
        bookService.return.mockResolvedValue({});
        window.confirm = jest.fn(() => true); // Mock confirm

        render(<TransactionHistory isActiveView={true} />);
        await screen.findByText('Clean Code');

        const returnButtons = screen.getAllByText('Return');
        fireEvent.click(returnButtons[0]);

        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => expect(bookService.return).toHaveBeenCalledWith({ transactionId: 't1' }));
    });
});
