import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import BookInventory from './BookInventory';
import { bookService } from '../../services/bookService';

// Mock API
jest.mock('../../services/bookService');

const mockBooks = [
    { _id: '1', title: 'React Guide', author: 'Facebook', isbn: '12345', department: 'Computer Science', availableCopies: 5, totalCopies: 5 },
    { _id: '2', title: 'Physics 101', author: 'Einstein', isbn: '67890', department: 'Physics', availableCopies: 0, totalCopies: 2 }
];

describe('BookInventory Component', () => {
    beforeEach(() => {
        bookService.getAll.mockResolvedValue({ data: { data: mockBooks } });
    });

    test('renders book list correctly', async () => {
        render(<BookInventory onEdit={jest.fn()} onIssue={jest.fn()} />);

        expect(await screen.findByText('React Guide')).toBeInTheDocument();
        expect(screen.getByText('Physics 101')).toBeInTheDocument();
        // Updated text matcher for "Available" badge
        expect(screen.getAllByText('Available')[0]).toBeInTheDocument();
    });

    test('filters books by search term', async () => {
        render(<BookInventory />);
        await screen.findByText('React Guide');

        const searchInput = screen.getByPlaceholderText('Search Title, Author, ISBN...');
        fireEvent.change(searchInput, { target: { value: 'Physics' } });

        expect(screen.queryByText('React Guide')).not.toBeInTheDocument();
        expect(screen.getByText('Physics 101')).toBeInTheDocument();
    });

    test('shows Reserve button if no copies available', async () => {
        render(<BookInventory onIssue={jest.fn()} />);
        await screen.findByText('React Guide');

        // React Guide (5 copies) -> Should have Issue button
        // Physics 101 (0 copies) -> Should have Reserve button

        const issueButtons = screen.getAllByText('Issue');
        expect(issueButtons.length).toBeGreaterThanOrEqual(1);

        const reserveButtons = screen.getAllByText('Reserve');
        expect(reserveButtons.length).toBeGreaterThanOrEqual(1);
    });
});
