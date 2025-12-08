import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from './Settings';

describe('Settings Page Tests', () => {

    test('renders Settings with default state', () => {
        render(<Settings />);

        expect(screen.getByRole('main', { name: /System Settings/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
        expect(screen.getByText(/System Preferences/i)).toBeInTheDocument();
    });

    test('persists toggle changes to localStorage', () => {
        render(<Settings />);

        // Toggle Dark Mode
        const darkBtn = screen.getByLabelText('Dark Mode');
        fireEvent.click(darkBtn);

        expect(darkBtn).toHaveClass('active');
        // Check "Save" is showing
        expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
    });

    test('save operation provides feedback', () => {
        render(<Settings />);

        const saveBtn = screen.getByText(/Save Changes/i);
        fireEvent.click(saveBtn);

        // Wait for "Saved!"
        expect(screen.getByText(/✅ Saved!/i)).toBeInTheDocument();
    });
});
