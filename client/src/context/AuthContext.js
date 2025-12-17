import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Failed to parse user from local storage", error);
                localStorage.removeItem('user');
            }
        }
    }, []);

    const login = async (email, password) => {
        try {
            console.log("Attempting login to http://127.0.0.1:5000/api/auth/login...");
            const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
                method: 'POST',
                mode: 'cors',
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            console.log("Response status:", response.status);
            const data = await response.json();

            if (data.success) {
                console.log("Login success:", data);
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            } else {
                console.warn("Login data failed:", data);
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error("Login Network Error:", error);
            // Check if it's a fetch error to localhost
            if (error.message.includes('Failed to fetch')) {
                return { success: false, message: 'Unable to connect to Server at 127.0.0.1:5000' };
            }
            return { success: false, message: 'Network Error: ' + error.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
