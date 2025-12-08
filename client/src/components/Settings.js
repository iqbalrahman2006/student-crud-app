import React, { useState, useEffect } from 'react';
import '../App.css';

/**
 * SETTINGS MODULE (ENTERPRISE EDITION)
 * 
 * Provides persistent user preferences using localStorage.
 * Controls Theme, Table Density, Notifications, and System Diagnostics.
 */
const Settings = ({
    theme, setTheme,
    density, setDensity,
    refreshInterval, setRefreshInterval
}) => {

    // Internal state for unsaved changes visualization
    const [localConfig, setLocalConfig] = useState({
        theme: localStorage.getItem('app_theme') || 'light',
        density: localStorage.getItem('app_density') || 'comfortable',
        refreshInterval: localStorage.getItem('app_refresh') || '0',
        softDelete: localStorage.getItem('app_softDelete') === 'true',
        adminName: localStorage.getItem('admin_name') || '',
        adminRole: localStorage.getItem('admin_role') || 'Administrator',
        notifications: JSON.parse(localStorage.getItem('app_notifications') || '{"email": true, "sms": false}')
    });

    const [isSaved, setIsSaved] = useState(false);
    const [systemStatus, setSystemStatus] = useState("Checking...");

    // Simulated System Health Check
    useEffect(() => {
        const checkHealth = async () => {
            // Quick pseudo-ping
            setSystemStatus("Pinging...");
            setTimeout(() => {
                setSystemStatus("Online (Stable)");
            }, 800);
        };
        checkHealth();
    }, []);

    const handleChange = (base, value) => {
        setLocalConfig(prev => ({ ...prev, [base]: value }));
        setIsSaved(false);
    };

    const handleNotificationChange = (type) => {
        setLocalConfig(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [type]: !prev.notifications[type] }
        }));
        setIsSaved(false);
    };

    const saveSettings = () => {
        // Persist to localStorage
        localStorage.setItem('app_theme', localConfig.theme);
        localStorage.setItem('app_density', localConfig.density);
        localStorage.setItem('app_refresh', localConfig.refreshInterval);
        localStorage.setItem('app_softDelete', localConfig.softDelete);

        // Persist Admin Profile
        localStorage.setItem('admin_name', localConfig.adminName);
        localStorage.setItem('admin_role', localConfig.adminRole);
        localStorage.setItem('app_notifications', JSON.stringify(localConfig.notifications));

        // Apply to App State (if passed as props)
        if (setTheme) setTheme(localConfig.theme);
        if (setDensity) setDensity(localConfig.density);
        if (setRefreshInterval) setRefreshInterval(parseInt(localConfig.refreshInterval));

        // Visual Feedback
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const resetDefaults = () => {
        const defaults = {
            theme: 'light',
            density: 'comfortable',
            refreshInterval: '0',
            softDelete: false,
            adminName: '',
            adminRole: 'Administrator',
            notifications: { email: true, sms: false }
        };
        setLocalConfig(defaults);
        setIsSaved(false);
    };

    return (
        <div className="settings-container fade-in">
            <div className="settings-header">
                <h2>System Preferences</h2>
                <div className="settings-actions">
                    <button className="button button-cancel" onClick={resetDefaults}>Reset Defaults</button>
                    <button className="button button-submit" onClick={saveSettings}>
                        {isSaved ? "✅ Saved!" : "Save Changes"}
                    </button>
                </div>
            </div>

            <div className="settings-grid">

                {/* ADMIN PROFILE */}
                <div className="settings-card">
                    <h3>👤 Admin Profile</h3>
                    <div className="setting-input-group">
                        <label>Display Name</label>
                        <input
                            type="text"
                            className="floating-input"
                            value={localConfig.adminName}
                            onChange={(e) => handleChange('adminName', e.target.value)}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div className="setting-input-group mt-2">
                        <label>Role / Designation</label>
                        <input
                            type="text"
                            className="floating-input"
                            value={localConfig.adminRole}
                            onChange={(e) => handleChange('adminRole', e.target.value)}
                        />
                    </div>
                </div>

                {/* VISUAL PREFERENCES */}
                <div className="settings-card">
                    <h3>🎨 Interface Appearance</h3>

                    <div className="setting-row">
                        <div className="setting-info">
                            <label>Theme Mode</label>
                            <p>Toggle between corporate light and dark mode.</p>
                        </div>
                        <div className="toggle-group">
                            <button
                                className={`toggle-btn ${localConfig.theme === 'light' ? 'active' : ''}`}
                                onClick={() => handleChange('theme', 'light')}
                            >Light</button>
                            <button
                                className={`toggle-btn ${localConfig.theme === 'dark' ? 'active' : ''}`}
                                onClick={() => handleChange('theme', 'dark')}
                            >Dark</button>
                        </div>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <label>Table Density</label>
                            <p>Adjust data grid spacing.</p>
                        </div>
                        <select
                            value={localConfig.density}
                            onChange={(e) => handleChange('density', e.target.value)}
                            className="setting-select"
                        >
                            <option value="comfortable">Comfortable</option>
                            <option value="compact">Compact</option>
                            <option value="spacious">Spacious</option>
                        </select>
                    </div>
                </div>

                {/* NOTIFICATIONS */}
                <div className="settings-card">
                    <h3>🔔 Notifications</h3>
                    <div className="setting-row">
                        <div className="setting-info">
                            <label>Email Alerts</label>
                            <p>Receive daily digest summaries.</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={localConfig.notifications.email}
                                onChange={() => handleNotificationChange('email')}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="setting-row">
                        <div className="setting-info">
                            <label>SMS Alerts</label>
                            <p>Receive critical system warnings.</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={localConfig.notifications.sms}
                                onChange={() => handleNotificationChange('sms')}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                {/* DATA OPERATIONS SECTION */}
                <div className="settings-card">
                    <h3>💾 Data Operations</h3>

                    <div className="setting-row">
                        <div className="setting-info">
                            <label>Auto-Refresh Interval</label>
                            <p>Poll server for updates.</p>
                        </div>
                        <select
                            value={localConfig.refreshInterval}
                            onChange={(e) => handleChange('refreshInterval', e.target.value)}
                            className="setting-select"
                        >
                            <option value="0">Manual Only (Off)</option>
                            <option value="30000">Every 30 Seconds</option>
                            <option value="60000">Every Minute</option>
                            <option value="300000">Every 5 Minutes</option>
                        </select>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <label>Soft Delete Simulation</label>
                            <p>Archive instead of permanent delete.</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={localConfig.softDelete}
                                onChange={(e) => handleChange('softDelete', e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                {/* SYSTEM DIAGNOSTICS */}
                <div className="settings-card full-width-card">
                    <h3>🛠️ System Diagnostics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div className="diag-row">
                            <span>API Connection</span>
                            <span className={`badge ${systemStatus.includes("Online") ? "badge-success" : "badge-warning"}`}>{systemStatus}</span>
                        </div>
                        <div className="diag-row">
                            <span>Database</span>
                            <span className="badge badge-success">Connected</span>
                        </div>
                        <div className="diag-row">
                            <span>Client Version</span>
                            <span className="text-muted">v3.0.0 Enterprise</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
