import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import BookInventory from './BookInventory';
import * as api from '../../services/api';

// Mock API
jest.mock('../../services/api');

const mockBooks = [
    { _id: '1', title: 'React Guide', author: 'Facebook', isbn: '12345', department: 'Computer Science', availableCopies: 5, totalCopies: 5 },
    { _id: '2', title: 'Physics 101', author: 'Einstein', isbn: '67890', department: 'Physics', availableCopies: 0, totalCopies: 2 }
];

describe('BookInventory Component', () => {
    beforeEach(() => {
        api.getBooks.mockResolvedValue({ data: { data: mockBooks } });
    });

    test('renders book list correctly', async () => {
        render(<BookInventory onEdit={jest.fn()} onIssue={jest.fn()} />);

        expect(await screen.findByText('React Guide')).toBeInTheDocument();
        expect(screen.getByText('Physics 101')).toBeInTheDocument();
        expect(screen.getByText('5 Available')).toBeInTheDocument();
    });

    test('filters books by search term', async () => {
        render(<BookInventory />);
        await screen.findByText('React Guide');

        const searchInput = screen.getByPlaceholderText('Search Title, Author, ISBN...');
        fireEvent.change(searchInput, { target: { value: 'Physics' } });

        expect(screen.queryByText('React Guide')).not.toBeInTheDocument();
        expect(screen.getByText('Physics 101')).toBeInTheDocument();
    });

    test('disables Issue button if no copies available', async () => {
        render(<BookInventory onIssue={jest.fn()} />);
        await screen.findByText('React Guide');

        // Check for enabled button for React Guide
        const issueButtons = screen.getAllByText('Issue');
        expect(issueButtons[0]).not.toBeDisabled(); // React Guide has copies

        // In list view logic, we might not render the button or render it differently. 
        // Let's switch to Card view to verify disabled state if implemented there, or check logic in List
        // The current implementation conditionally renders Issue button in List view.

        // Let's check that only ONE issue button is rendered (for React Guide) because Physics is 0
        expect(issueButtons).toHaveLength(1);
    });

    test('toggles between list and card view', async () => {
        render(<BookInventory />);
        await screen.findByText('React Guide');

        const cardBtn = screen.getByText('🔳 Cards');
        fireEvent.click(cardBtn);

        // In card view, we look for card-specific classes or structure
        // The component uses 'stat-card' class for cards
        const cards = document.getElementsByClassName('stat-card');
        expect(cards.length).toBeGreaterThan(0);
    });
});
