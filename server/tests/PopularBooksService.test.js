const request = require('supertest');
const express = require('express');
const libraryRoutes = require('../src/routes/library');
const mongoose = require('mongoose');

// Mock Mongoose Models
jest.mock('../src/models/Book');
jest.mock('../src/models/Transaction');
jest.mock('../src/models/Student');
jest.mock('../src/models/LibraryFineLedger');
jest.mock('../src/models/BookReservation');
jest.mock('../src/models/LibraryAuditLog');

// Middleware Mock
jest.mock('../src/middleware/rbac', () => () => (req, res, next) => next());

const Book = require('../src/models/Book');
const Transaction = require('../src/models/Transaction');
const BookReservation = require('../src/models/BookReservation');

const app = express();
app.use(express.json());
app.use('/api/v1/library', libraryRoutes);

describe('Library Analytics Service', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mocks for non-target aggregations
        Book.countDocuments.mockResolvedValue(100);
        Transaction.countDocuments.mockResolvedValue(10);
        require('../src/models/LibraryFineLedger').aggregate.mockResolvedValue([]);
        BookReservation.countDocuments.mockResolvedValue(0);
        Book.aggregate.mockResolvedValue([]);
    });

    test('Tier 1: Returns Transaction Data if exists', async () => {
        Transaction.aggregate.mockResolvedValue([
            { title: 'The Great Gatsby', count: 10 },
            { title: '1984', count: 8 }
        ]);

        const res = await request(app).get('/api/v1/library/analytics');

        expect(res.statusCode).toBe(200);
        expect(res.body.data.popularBooks).toHaveLength(2);
        expect(res.body.data.popularBooks[0].title).toBe('The Great Gatsby');
        // Ensure Backup tiers NOT called
        expect(BookReservation.aggregate).not.toHaveBeenCalled();
    });

    test('Tier 2: Fallback to Reservations if Transactions empty', async () => {
        Transaction.aggregate.mockResolvedValue([]); // Empty Transactions
        BookReservation.aggregate.mockResolvedValue([
            { title: 'Reservation Hit', count: 5 }
        ]);

        const res = await request(app).get('/api/v1/library/analytics');

        expect(res.statusCode).toBe(200);
        expect(res.body.data.popularBooks).toHaveLength(1);
        expect(res.body.data.popularBooks[0].title).toBe('Reservation Hit');
    });

    test('Tier 3: Fallback to Inventory if both empty', async () => {
        Transaction.aggregate.mockResolvedValue([]);
        BookReservation.aggregate.mockResolvedValue([]);

        Book.find.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([
                    { title: 'Inventory King', popularityIndex: 99 },
                    { title: 'Inventory Queen', totalCopies: 50 }
                ])
            })
        });

        const res = await request(app).get('/api/v1/library/analytics');

        expect(res.statusCode).toBe(200);
        expect(res.body.data.popularBooks).toHaveLength(2);
        expect(res.body.data.popularBooks[0].title).toBe('Inventory King');
        // Ensure Book.find was called for fallback
        expect(Book.find).toHaveBeenCalled();
    });
});
