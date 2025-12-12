import { bookService } from '../src/services/bookService';
import apiClient from '../src/services/apiUtils';

jest.mock('../src/services/apiUtils');

describe('Book Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getAll fetches books with params', async () => {
        apiClient.mockResolvedValue({ data: [] });
        await bookService.getAll({ page: 1 });
        expect(apiClient).toHaveBeenCalledWith(expect.objectContaining({
            method: 'GET',
            url: '/library/books',
            params: { page: 1 }
        }));
    });

    test('issue sends CORRECT transaction payload', async () => {
        const payload = { bookId: '123', studentId: '456' };
        apiClient.mockResolvedValue({ data: { status: 'issued' } });

        await bookService.issue(payload);
        expect(apiClient).toHaveBeenCalledWith(expect.objectContaining({
            method: 'POST',
            url: '/library/issue',
            data: payload
        }));
    });
});
