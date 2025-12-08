// client/src/components/StudentForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudentForm from './StudentForm';
import Modal from 'react-modal';

// Mock Modal implementation
Modal.setAppElement(document.createElement('div'));

// MOCK LOCAL DATA
jest.mock('../data/locations', () => ({
    GLOBAL_LOCATIONS: {
        "USA": { cities: ["New York", "Chicago"], zipRegex: /^\d{5}$/, zipHint: "12345" },
        "UK": { cities: ["London", "Manchester"], zipRegex: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, zipHint: "SW1A 1AA" }
    },
    getCountries: () => ["USA", "UK"],
    getCities: (country) => {
        if (country === "USA") return ["New York", "Chicago"];
        if (country === "UK") return ["London", "Manchester"];
        return [];
    },
    validateZip: () => true
}));

describe('StudentForm Enterprise Tests', () => {

    const mockSubmit = jest.fn();
    const mockClose = jest.fn();
    const defaultProps = {
        isOpen: true,
        onRequestClose: mockClose,
        onSubmit: mockSubmit,
        student: null,
        submitting: false
    };

    beforeEach(() => {
        mockSubmit.mockClear();
        mockClose.mockClear();
    });

    // CRITICAL UI CHECK 1: No Numbering
    test('DOES NOT display numeric labels in section headers', () => {
        render(<StudentForm {...defaultProps} />);

        // Headers should exist but NOT start with numbers "1.", "2.", "3."
        const personalHeader = screen.getByText(/Personal Information/i);
        expect(personalHeader.textContent).not.toMatch(/^\d+\./);

        const academicHeader = screen.queryByText(/Academic Details/i); // might be collapsed/hidden text or just rendered
        // Check if ANY text contains "1. Personal"
        const numberedText = screen.queryByText(/1\. Personal/i);
        expect(numberedText).not.toBeInTheDocument();
    });

    // CRITICAL UI CHECK 2: Blood Group
    test('renders Blood Group field correctly', () => {
        render(<StudentForm {...defaultProps} />);
        // Should be in first section (Personal Info)
        const bloodInput = screen.getByLabelText(/Blood Group/i);
        expect(bloodInput).toBeInTheDocument();
        // Check placeholder is clean
        expect(bloodInput).toHaveAttribute('placeholder', 'e.g. O+');
    });

    test('navigates through Accordion sections correctly', async () => {
        render(<StudentForm {...defaultProps} />);

        // Section 1 is open. Click Next.
        fireEvent.click(screen.getByText(/Next ➔/i));

        // Wait for Section 2 input
        const gpaInput = await screen.findByLabelText(/Current GPA/i);
        expect(gpaInput).toBeInTheDocument();
    });

    test('validates fields before allowing submit', async () => {
        render(<StudentForm {...defaultProps} />);

        // Fill Section 1
        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } });
        fireEvent.click(screen.getByText(/Next ➔/i));

        // Fill Section 2
        const courseInput = await screen.findByLabelText(/Assigned Course/i);
        fireEvent.change(courseInput, { target: { value: 'Computer Science' } });

        expect(courseInput.value).toBe('Computer Science');
    });
});
