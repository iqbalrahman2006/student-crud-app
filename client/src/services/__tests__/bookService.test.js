import { bookService } from '../bookService';
import { request } from '../apiUtils';

jest.mock('../apiUtils', () => ({
    request: jest.fn(),
    __esModule: true,
    default: jest.fn()
}));

describe('Book Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getAll fetches books with params', async () => {
        request.mockResolvedValue({ data: [] });
        await bookService.getAll({ page: 1 });
        expect(request).toHaveBeenCalledWith('GET', '/library/books', null, { page: 1 });
    });

    test('issue sends CORRECT transaction payload', async () => {
        const payload = { bookId: '123', studentId: '456' };
        request.mockResolvedValue({ status: 'issued' });

        await bookService.issue(payload);
        expect(request).toHaveBeenCalledWith('POST', '/library/issue', payload);
    });
});
