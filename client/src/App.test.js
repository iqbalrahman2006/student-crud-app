import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from './App';
import { studentService } from './services/studentService';

// Mock Student Service
jest.mock('./services/studentService', () => ({
    studentService: {
        getAll: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
    }
}));

// MOCK LOCATION DATA (Prevent OOM)
jest.mock('./data/locations', () => ({
    GLOBAL_LOCATIONS: {},
    getCountries: () => ["USA"],
    getCities: () => ["New York"],
    validateZip: () => true
}));

describe('Enterprise App Integration', () => {
    beforeEach(() => {
        studentService.getAll.mockResolvedValue([
            { _id: '1', name: 'Emily Chen', status: 'Active', country: 'USA', city: 'New York' }
        ]);
        jest.clearAllMocks();
    });

    test('renders Dashboard by default', async () => {
        render(<App />);
        expect(await screen.findByText(/Total Students/i)).toBeInTheDocument();
    });

    test('navigates to Reports module', async () => {
        render(<App />);
        // Wait for data load
        await screen.findByText(/Total Students/i);

        const reportsLinks = screen.getAllByText(/Reports/i);
        fireEvent.click(reportsLinks[0]); // Click sidebar link

        expect(screen.getByText(/Analytics & Reports/i)).toBeInTheDocument();
    });

    test('navigates to Settings module', async () => {
        render(<App />);
        // Wait for data load
        await screen.findByText(/Total Students/i);

        const settingsLinks = screen.getAllByText(/Settings/i);
        fireEvent.click(settingsLinks[0]);

        expect(screen.getByText(/System Settings/i)).toBeInTheDocument();
    });

    test('navigates back to Students list', async () => {
        render(<App />);
        // Wait for data load
        await screen.findByText(/Total Students/i);

        // Go to reports then back to students
        const reportsLinks = screen.getAllByText(/Reports/i);
        fireEvent.click(reportsLinks[0]);

        // Ensure we are on reports
        expect(screen.getByText(/Analytics & Reports/i)).toBeInTheDocument();

        const studentLinks = screen.getAllByText(/Students/i);
        // Usually the first one is Sidebar, second might be breadcrumb or button
        fireEvent.click(studentLinks[0]);

        // Wait for students to load (searching for our specific test student)
        expect(await screen.findByText('Emily Chen')).toBeInTheDocument();
    });
});
