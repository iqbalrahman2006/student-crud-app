import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-role': 'ADMIN' // Auto-inject Admin Role for Demo
    }
});

// Retry Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

apiClient.interceptors.response.use(null, async (error) => {
    const config = error.config;

    // If config does not exist or the retry option is not set, reject
    if (!config || !config.retry) {
        return Promise.reject(error);
    }

    // Set the variable for keeping track of the retry count
    config.__retryCount = config.__retryCount || 0;

    // Check if we've maxed out the total number of retries
    if (config.__retryCount >= MAX_RETRIES) {
        // Reject with the error
        return Promise.reject(error);
    }

    // Increase the retry count
    config.__retryCount += 1;

    // Create new promise to handle exponential backoff
    const backoff = new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, RETRY_DELAY);
    });

    // Return the promise in which recalls axios to retry the request
    await backoff;
    return apiClient(config);
});

// Standardized Request Wrapper
export const request = async (method, url, data = null, params = null, config = {}) => {
    try {
        const requestConfig = {
            method,
            url,
            params,
            ...config, // Merge custom config (e.g. responseType)
            retry: method === 'GET' // Only retry GET requests by default
        };

        // Only include data if it's not null (important for DELETE requests)
        if (data !== null) {
            requestConfig.data = data;
        }

        const response = await apiClient(requestConfig);
        return response;
    } catch (error) {
        console.warn(`API ${method} ${url} Failed:`, error.message);
        throw error.response ? error.response.data : new Error(error.message);
    }
};

export default apiClient;
