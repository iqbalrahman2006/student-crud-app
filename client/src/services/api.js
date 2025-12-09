import axios from "axios";

const API_URL = "http://localhost:5000/api/v1";

// --- SAFE REQUEST WRAPPER ---
const safeRequest = async (method, endpoint, payload = null, params = null) => {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: { 'Content-Type': 'application/json' }
        };

        // Only add data for POST, PUT, PATCH - NOT for DELETE or GET
        if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.data = payload;
        }
        if (params) {
            config.params = params;
        }

        const response = await axios(config);
        return response;
    } catch (error) {
        // Standard API Error (400, 404, 500) - Pass to UI
        if (error.response) {
            console.error("API Error Response:", error.response.data);
        }
        console.warn(`API Request Failed: ${error.message}`);
        throw error;
    }
};

// --- EXPORTED API FUNCTIONS ---

export const getStudents = () => safeRequest('GET', '/students');

export const addStudent = (student) => safeRequest('POST', '/students', student);

export const updateStudent = (id, student) => safeRequest('PUT', `/students/${id}`, student);

export const deleteStudent = (id) => safeRequest('DELETE', `/students/${id}`);

// --- LIBRARY SERVICES ---
export const getBooks = (params) => safeRequest('GET', '/library/books', null, params);
export const addBook = (book) => safeRequest('POST', '/library/books', book);
export const updateBook = (id, book) => safeRequest('PATCH', `/library/books/${id}`, book);
export const deleteBook = (id) => safeRequest('DELETE', `/library/books/${id}`);
export const issueBook = (data) => safeRequest('POST', '/library/issue', data);
export const returnBook = (data) => safeRequest('POST', '/library/return', data);
export const renewBook = (data) => safeRequest('POST', '/library/renew', data);
export const getTransactions = (status) => safeRequest('GET', `/library/transactions${status ? `?status=${status}` : ''}`);
export const triggerReminders = () => safeRequest('POST', '/library/trigger-reminders');
export const getLibraryAnalytics = () => safeRequest('GET', '/library/analytics');
export const getStudentLibraryProfile = (id) => safeRequest('GET', `/library/profile/${id}`);
export const reserveBook = (data) => safeRequest('POST', '/library/reserve', data);
export const getAuditLogs = (params) => safeRequest('GET', '/library/audit-logs', null, params);

