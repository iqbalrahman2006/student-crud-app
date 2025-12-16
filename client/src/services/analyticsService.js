import { request } from './apiUtils';

export const analyticsService = {
    getLibraryAnalytics: () => request('GET', '/library/analytics'),
    getInventorySummary: () => request('GET', '/library/inventory/summary'),
    getReminderStatus: () => request('GET', '/library/reminders/status'),
    getAuditLogs: (params) => request('GET', '/library/audit-logs', null, params),
    triggerReminders: () => request('POST', '/library/trigger-reminders'),
    // Quick Actions
    downloadWeeklyReport: () => request('GET', '/reports/weekly'),
    sendBlastEmail: (data) => request('POST', '/notifications/blast', data)
};
