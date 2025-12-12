import { studentService } from '../src/services/studentService';
import apiClient from '../src/services/apiUtils';

jest.mock('../src/services/apiUtils');

describe('Student Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getAll fetches students correctly', async () => {
        const mockData = { data: [{ name: 'Test Student' }] };
        apiClient.mockResolvedValue(mockData);

        const result = await studentService.getAll();
        expect(apiClient).toHaveBeenCalledWith(expect.objectContaining({
            method: 'GET',
            url: '/students'
        }));
        // Our request wrapper returns response.data, so if apiClient returns {data: ...}, 
        // the wrapper returns ... wait, my wrapper implementation:
        // return response.data;
        // So if axios resolves { data: X }, function returns X.
        // But my mock is on apiClient which IS the axios instance.
        // So mock should return { data: expectedResult }
        expect(result).toEqual([{ name: 'Test Student' }]);
    });

    test('create sends POST request', async () => {
        const newStudent = { name: 'New Student' };
        apiClient.mockResolvedValue({ data: newStudent });

        const result = await studentService.create(newStudent);
        expect(apiClient).toHaveBeenCalledWith(expect.objectContaining({
            method: 'POST',
            url: '/students',
            data: newStudent
        }));
        expect(result).toEqual(newStudent);
    });
});
