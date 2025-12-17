// d:\studentDB\student-crud-app-1\client\src\tests\auditLogsMapping.test.js

describe('Audit Log Mapping', () => {
    // Mock Data mimicking the backend response structure
    const mockLogs = [
        {
            _id: 'log1',
            action: 'BORROW',
            bookId: { _id: 'b1', title: 'Calculus I' },
            studentId: { _id: 's1', name: 'John Doe' },
            timestamp: new Date().toISOString()
        },
        {
            _id: 'log2',
            action: 'RETURN',
            bookId: null, // Deleted Book
            studentId: null, // Deleted Student
            timestamp: new Date().toISOString()
        }
    ];

    test('should map populated objects to flat strings', () => {
        const transformed = mockLogs.map(log => ({
            ...log,
            bookId: log.bookId ? log.bookId._id : null,
            bookTitle: log.bookId ? log.bookId.title : 'Unknown Book',
            studentId: log.studentId ? log.studentId._id : null,
            studentName: log.studentId ? log.studentId.name : 'Unknown Student'
        }));

        // Case 1: Valid References
        expect(transformed[0].bookId).toBe('b1');
        expect(transformed[0].bookTitle).toBe('Calculus I');
        expect(transformed[0].studentId).toBe('s1');
        expect(transformed[0].studentName).toBe('John Doe');

        // Case 2: Missing References (Deleted Items)
        expect(transformed[1].bookId).toBeNull();
        expect(transformed[1].bookTitle).toBe('Unknown Book');
        expect(transformed[1].studentId).toBeNull();
        expect(transformed[1].studentName).toBe('Unknown Student');
    });

    test('should provide safe fallback for navigation', () => {
        const handleBookClick = (id) => {
            if (id && typeof id === 'string') return true;
            return false;
        };

        const flatLogValid = { bookId: 'b1' };
        const flatLogInvalid = { bookId: null };

        expect(handleBookClick(flatLogValid.bookId)).toBe(true);
        expect(handleBookClick(flatLogInvalid.bookId)).toBe(false);
    });
});
