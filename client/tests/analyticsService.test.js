import { analyticsService } from '../src/services/analyticsService';
import apiClient from '../src/services/apiUtils';

jest.mock('../src/services/apiUtils');

describe('Analytics Service', () => {
    test('fetches library analytics', async () => {
        apiClient.mockResolvedValue({ data: { popularBooks: [] } });
        await analyticsService.getLibraryAnalytics();
        expect(apiClient).toHaveBeenCalledWith(expect.objectContaining({
            method: 'GET',
            url: '/library/analytics'
        }));
    });

    test('triggerReminders calls POST', async () => {
        apiClient.mockResolvedValue({ data: { success: true } });
        await analyticsService.triggerReminders();
        expect(apiClient).toHaveBeenCalledWith(expect.objectContaining({
            method: 'POST',
            url: '/library/trigger-reminders'
        }));
    });
});
