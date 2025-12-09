import axios from "axios";

const API_URL = "http://localhost:5000/api/v1";

// --- SAFE REQUEST WRAPPER ---
const safeRequest = async (method, endpoint, payload = null) => {
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

