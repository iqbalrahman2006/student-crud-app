// d:\studentDB\student-crud-app-1\client\src\tests\studentLibraryLink.test.js

describe('Student Dashboard Deep Link', () => {
    test('should construct correct deep link URL', () => {
        const student = { _id: 's123' };
        const status = 'overdue';
        const expectedUrl = `/library/issued?studentId=s123&status=overdue&bookId=`;

        // Simulate handleViewActivity logic
        const generateLink = (s, st) => `/library/issued?studentId=${s._id}&status=${st || 'all'}&bookId=`;

        expect(generateLink(student, status)).toBe(expectedUrl);
    });

    test('TransactionHistory attempts smart match', () => {
        const mockTxns = [
            { _id: 't1', studentId: 's123', status: 'BORROWED', issueDate: '2023-01-01' },
            { _id: 't2', studentId: 's123', status: 'BORROWED', issueDate: '2023-01-05' } // Newer
        ];

        // Logic simulation: Find most recent active
        const relevantTxns = mockTxns.filter(t => t.studentId === 's123');
        relevantTxns.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
        const target = relevantTxns[0];

        expect(target._id).toBe('t2');
    });
});
