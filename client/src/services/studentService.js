import { request } from './apiUtils';

export const studentService = {
    getAll: (params) => request('GET', '/students', null, params),
    create: (student) => request('POST', '/students', student),
    update: (id, student) => request('PUT', `/students/${id}`, student),
    delete: (id) => request('DELETE', `/students/${id}`)
};
