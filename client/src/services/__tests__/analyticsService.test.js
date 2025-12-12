import { analyticsService } from '../analyticsService';
import { request } from '../apiUtils';

jest.mock('../apiUtils', () => ({
    request: jest.fn(),
    __esModule: true,
    default: jest.fn()
}));

describe('Analytics Service', () => {
    test('fetches library analytics', async () => {
        request.mockResolvedValue({ popularBooks: [] });
        await analyticsService.getLibraryAnalytics();
        expect(request).toHaveBeenCalledWith('GET', '/library/analytics');
    });

    test('triggerReminders calls POST', async () => {
        request.mockResolvedValue({ success: true });
        await analyticsService.triggerReminders();
        expect(request).toHaveBeenCalledWith('POST', '/library/trigger-reminders');
    });
});
