import axios from "axios";
import { mockStudents } from "./mockData";

const API_URL = "http://localhost:5000/api/v1";

// ENTERPRISE CONFIGURATION
// Set to 'false' to use Real Backend (Port 5000)
// Set to 'false' to use Real Backend (Port 5000)
// Set to 'true' to force Mock Data (Offline Mode)
const USE_MOCK = false;

// Helper for delay to simulate network in mock mode
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Local state for mock data
let students = [...mockStudents];

// --- HYBRID FALLBACK SYSTEM ---
let isBackendOffline = false; // Runtime flag to avoid repeated timeouts

// Mock Logic Extracted for Reuse
const runMockRequest = async (method, endpoint, payload) => {
    await delay(300); // Simulate latency
    try {
        switch (method) {
            case 'GET':
                if (endpoint === '/students') return { data: students };
                break;
            case 'POST':
                if (endpoint === '/students') {
                    const newStudent = { ...payload, _id: Date.now().toString() };
                    students = [newStudent, ...students];
                    return { data: newStudent };
                }
                break;
            case 'PUT':
            case 'PATCH':
                const updateId = endpoint.split('/').pop();
                students = students.map(s => s._id === updateId ? { ...payload, _id: updateId } : s);
                return { data: payload };
            case 'DELETE':
                const deleteId = endpoint.split('/').pop();
                students = students.filter(s => s._id !== deleteId);
                return { data: { message: "Deleted" } };
            default:
                throw new Error(`Mock Method ${method} not implemented`);
        }
    } catch (err) {
        console.error("Mock Logic Error:", err);
        throw err;
    }
};

// --- SAFE REQUEST WRAPPER ---
const safeRequest = async (method, endpoint, payload = null) => {
    // 1. Force Mock Mode if Configured OR Backend previously failed
    if (USE_MOCK || isBackendOffline) {
        return runMockRequest(method, endpoint, payload);
    }

    // 2. Attempt Real Backend
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
        // 3. Auto-Fallback on Network Failure
        // If there is NO response (Network Error, Connection Refused, Timeout)
        if (!error.response) {
            console.warn(`Backend Connection Failed [${error.message}]. Switching to Offline Mode.`);
            isBackendOffline = true; // Set flag to avoid retrying backend immediately

            // Notify via Console (Toast handled by App.js)
            // We re-route this specific request to Mock immediately so user doesn't see error
            return runMockRequest(method, endpoint, payload);
        }

        // Standard API Error (400, 404, 500) - Pass to UI
        if (error.response) {
            console.error("API Error Response:", error.response.data);
        }
        throw error;
    }
};

// --- EXPORTED API FUNCTIONS ---

export const getStudents = () => safeRequest('GET', '/students');

export const addStudent = (student) => safeRequest('POST', '/students', student);

export const updateStudent = (id, student) => safeRequest('PUT', `/students/${id}`, student);

export const deleteStudent = (id) => safeRequest('DELETE', `/students/${id}`);
