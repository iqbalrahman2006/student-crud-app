import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Login.css'; // Import the new premium styles

const Login = () => {
    const history = useHistory();
    const { login } = useAuth() || {};
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!login) {
            setError("Configuration Error: AuthContext not found.");
            setLoading(false);
            return;
        }

        const result = await login(formData.email, formData.password);

        if (result && result.success) {
            console.log("Login Successful", result);
            history.push('/');
        } else {
            setError(result?.message || "Invalid credentials. Please try again.");
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-card">

                {/* Header */}
                <div className="login-header">
                    <div className="login-icon-wrapper">
                        🔐
                    </div>
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">
                        Enter your credentials to access the<br />Student Management Portal.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="login-error">
                        ⚠️ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">

                    {/* Email Field */}
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="name@school.com"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    {/* Password Field */}
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="Enter your password"
                            className="form-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="login-button"
                    >
                        {loading ? (
                            <span><span className="spinner"></span>Authenticating...</span>
                        ) : 'Sign In to Dashboard'}
                    </button>
                </form>

                {/* Footer */}
                <div className="login-footer">
                    <p className="footer-text">
                        🔒 Secure Connection • Safe Mode Active
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
