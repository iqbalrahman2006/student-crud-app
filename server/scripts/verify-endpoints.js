const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';
const headers = { 'Content-Type': 'application/json', 'x-role': 'ADMIN' };

async function checkAPI() {
    try {
        console.log("Checking /students...");
        const students = await axios.get(`${API_URL}/students`, { headers });
        console.log(`Students Status: ${students.status}`);
        console.log(`Students Count: ${Array.isArray(students.data.data) ? students.data.data.length : 'N/A'}`);

        console.log("\nChecking /library/books...");
        const books = await axios.get(`${API_URL}/library/books`, { headers });
        console.log(`Books Status: ${books.status}`);
        console.log(`Books Count: ${Array.isArray(books.data.data) ? books.data.data.length : 'N/A'}`);

    } catch (error) {
        console.error("API Check Failed:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

checkAPI();
