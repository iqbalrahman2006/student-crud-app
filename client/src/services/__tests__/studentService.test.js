import { studentService } from '../studentService';
import { request } from '../apiUtils';

jest.mock('../apiUtils', () => ({
    request: jest.fn(),
    __esModule: true,
    default: jest.fn()
}));

describe('Student Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getAll fetches students correctly', async () => {
        const mockData = [{ name: 'Test Student' }];
        request.mockResolvedValue(mockData);

        const result = await studentService.getAll();
        // STRICT: Verify exactly calling the API, no local fallback
        expect(request).toHaveBeenCalledWith('GET', '/students');
        expect(result).toEqual(mockData);
    });

    test('getAll should throw error if API fails (no mock fallback)', async () => {
        request.mockRejectedValue(new Error('Network Error'));
        await expect(studentService.getAll()).rejects.toThrow('Network Error');
    });

    test('create sends POST request', async () => {
        const newStudent = { name: 'New Student' };
        request.mockResolvedValue(newStudent);

        const result = await studentService.create(newStudent);
        expect(request).toHaveBeenCalledWith('POST', '/students', newStudent);
        expect(result).toEqual(newStudent);
    });
});
