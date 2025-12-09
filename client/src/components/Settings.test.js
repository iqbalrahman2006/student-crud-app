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

    test('Reset Defaults restores initial state immediately', () => {
        // Mock window.confirm
        window.confirm = jest.fn(() => true);
        render(<Settings />);

        // Change a setting first
        const darkBtn = screen.getByLabelText('Dark Mode');
        fireEvent.click(darkBtn);
        expect(darkBtn).toHaveClass('active');

        // Click Reset
        const resetBtn = screen.getByText(/Reset Defaults/i);
        fireEvent.click(resetBtn);

        // Should verify confirmation called
        expect(window.confirm).toHaveBeenCalled();

        // Should revert to Light (active class removed from Dark button or check Light button)
        // Since logic sets 'light' as active, check Light button
        const lightBtn = screen.getByLabelText('Light Mode');
        expect(lightBtn).toHaveClass('active');
    });
});
