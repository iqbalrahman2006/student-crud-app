import React, { useState, useEffect, useCallback } from 'react';
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
        theme: 'light',
        density: 'comfortable',
        refreshInterval: '0',
        softDelete: false,
        adminName: '',
        adminRole: 'Administrator',
        notifications: { email: true, sms: false }
    });

    const [isSaved, setIsSaved] = useState(false);
    const [systemStatus, setSystemStatus] = useState("Checking...");

    // Load initial settings safely
    useEffect(() => {
        try {
            setLocalConfig({
                theme: localStorage.getItem('app_theme') || 'light',
                density: localStorage.getItem('app_density') || 'comfortable',
                refreshInterval: localStorage.getItem('app_refresh') || '0',
                softDelete: localStorage.getItem('app_softDelete') === 'true',
                adminName: localStorage.getItem('admin_name') || '',
                adminRole: localStorage.getItem('admin_role') || 'Administrator',
                notifications: JSON.parse(localStorage.getItem('app_notifications') || '{"email": true, "sms": false}')
            });
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }, []);

    // Simulated System Health Check
    useEffect(() => {
        let mounted = true;
        const checkHealth = async () => {
            setSystemStatus("Pinging...");
            // Emulate async check
            await new Promise(r => setTimeout(r, 600));
            if (mounted) setSystemStatus("Online (Stable)");
        };
        checkHealth();
        return () => { mounted = false; };
    }, []);

    const handleChange = useCallback((base, value) => {
        setLocalConfig(prev => ({ ...prev, [base]: value }));
        setIsSaved(false);
    }, []);

    const handleNotificationChange = useCallback((type) => {
        setLocalConfig(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [type]: !prev.notifications[type] }
        }));
        setIsSaved(false);
    }, []);

    const saveSettings = useCallback(() => {
        try {
            // Persist to localStorage
            localStorage.setItem('app_theme', localConfig.theme);
            localStorage.setItem('app_density', localConfig.density);
            localStorage.setItem('app_refresh', localConfig.refreshInterval);
            localStorage.setItem('app_softDelete', localConfig.softDelete);

            // Persist Admin Profile
            localStorage.setItem('admin_name', localConfig.adminName);
            localStorage.setItem('admin_role', localConfig.adminRole);
            localStorage.setItem('app_notifications', JSON.stringify(localConfig.notifications));

            // Apply to App State immediately
            if (setTheme) setTheme(localConfig.theme);
            if (setDensity) setDensity(localConfig.density);
            if (setRefreshInterval) setRefreshInterval(parseInt(localConfig.refreshInterval));

            // Visual Feedback
            setIsSaved(true);

            // Brief "flash" logic handled by simple timeout
            setTimeout(() => setIsSaved(false), 2000);
        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save settings to local storage.");
        }
    }, [localConfig, setTheme, setDensity, setRefreshInterval]);

    const resetDefaults = () => {
        if (!window.confirm("Reset all settings to default?")) return;

        const defaults = {
            theme: 'light',
            density: 'comfortable',
            refreshInterval: '0',
            softDelete: false,
            adminName: '',
            adminRole: 'Administrator',
            notifications: { email: true, sms: false }
        };

        // 1. Update State
        setLocalConfig(defaults);

        // 2. Persist to LocalStorage immediately
        localStorage.setItem('app_theme', defaults.theme);
        localStorage.setItem('app_density', defaults.density);
        localStorage.setItem('app_refresh', defaults.refreshInterval);
        localStorage.setItem('app_softDelete', defaults.softDelete);
        localStorage.setItem('admin_name', defaults.adminName);
        localStorage.setItem('admin_role', defaults.adminRole);
        localStorage.setItem('app_notifications', JSON.stringify(defaults.notifications));

        // 3. Apply to App Props immediately
        if (setTheme) setTheme(defaults.theme);
        if (setDensity) setDensity(defaults.density);
        if (setRefreshInterval) setRefreshInterval(parseInt(defaults.refreshInterval));

        // 4. Feedback
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="settings-container fade-in" role="main" aria-label="System Settings">
            <div className="settings-header">
                <h2>System Preferences</h2>
                <div className="settings-actions">
                    <button className="button button-cancel" onClick={resetDefaults}>Reset Defaults</button>
                    <button className="button button-submit" onClick={saveSettings} aria-live="polite">
                        {isSaved ? "✅ Saved!" : "Save Changes"}
                    </button>
                </div>
            </div>

            <div className="settings-grid">

                {/* ADMIN PROFILE */}
                <div className="settings-card">
                    <h3>👤 Admin Profile</h3>
                    <div className="setting-input-group">
                        <label htmlFor="adminName">Display Name</label>
                        <input
                            id="adminName"
                            type="text"
                            className="floating-input"
                            value={localConfig.adminName}
                            onChange={(e) => handleChange('adminName', e.target.value)}
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div className="setting-input-group mt-2" style={{ marginTop: '16px' }}>
                        <label htmlFor="adminRole">Role / Designation</label>
                        <input
                            id="adminRole"
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
                        <div className="toggle-group" role="group" aria-label="Theme Selection">
                            <button
                                className={`toggle-btn ${localConfig.theme === 'light' ? 'active' : ''}`}
                                onClick={() => handleChange('theme', 'light')}
                                aria-pressed={localConfig.theme === 'light'}
                                aria-label="Light Mode"
                            >Light</button>
                            <button
                                className={`toggle-btn ${localConfig.theme === 'dark' ? 'active' : ''}`}
                                onClick={() => handleChange('theme', 'dark')}
                                aria-pressed={localConfig.theme === 'dark'}
                                aria-label="Dark Mode"
                            >Dark</button>
                        </div>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <label htmlFor="densitySelect">Table Density</label>
                            <p>Adjust data grid spacing.</p>
                        </div>
                        <select
                            id="densitySelect"
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
                            <label htmlFor="emailNotif">Email Alerts</label>
                            <p>Receive daily digest summaries.</p>
                        </div>
                        <label className="switch">
                            <input
                                id="emailNotif"
                                type="checkbox"
                                checked={localConfig.notifications.email}
                                onChange={() => handleNotificationChange('email')}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="setting-row">
                        <div className="setting-info">
                            <label htmlFor="smsNotif">SMS Alerts</label>
                            <p>Receive critical system warnings.</p>
                        </div>
                        <label className="switch">
                            <input
                                id="smsNotif"
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
                            <label htmlFor="refreshSelect">Auto-Refresh Interval</label>
                            <p>Poll server for updates.</p>
                        </div>
                        <select
                            id="refreshSelect"
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
                            <label htmlFor="softDeleteToggle">Soft Delete Simulation</label>
                            <p>Archive instead of permanent delete.</p>
                        </div>
                        <label className="switch">
                            <input
                                id="softDeleteToggle"
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
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
