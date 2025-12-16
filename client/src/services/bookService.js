import { request } from './apiUtils';

export const bookService = {
    getAll: (params) => request('GET', '/library/books', null, params),
    create: (book) => request('POST', '/library/books', book),
    update: (id, book) => request('PATCH', `/library/books/${id}`, book),
    delete: (id) => request('DELETE', `/library/books/${id}`),

    // Transactions
    issue: (data) => request('POST', '/library/issue', data),
    return: (data) => request('POST', '/library/return', data),
    renew: (data) => request('POST', '/library/renew', data),
    getTransactions: (status) => request('GET', `/library/transactions${status ? `?status=${status}` : ''}`),

    // Profile & Reservation
    getStudentProfile: (id) => request('GET', `/library/profile/${id}`),
    reserve: (data) => request('POST', '/library/reserve', data),
    getReservations: (status) => request('GET', `/library/reservations${status ? `?status=${status}` : ''}`),
    manageReservation: (data) => request('POST', '/library/reserve/action', data)
};
