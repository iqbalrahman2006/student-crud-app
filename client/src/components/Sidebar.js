import React from 'react';
import '../App.css';

/**
 * Sidebar Component
 * 
 * Responsible for the main application navigation.
 * Displays the brand logo and a list of navigation items.
 * Handles the "active" state styling for the current view.
 * 
 * @param {string} activeTab - The currently selected tab identifier
 * @param {function} setActiveTab - Function to update the active tab state
 */
const Sidebar = ({ activeTab, setActiveTab }) => {

    // Explicit Navigation Items Configuration
    // This allows for easy expansion of menu items in the future.
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'students', label: 'Students', icon: '👥' },
        { id: 'reports', label: 'Reports', icon: '📈' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="logo-box">S</div>
                <span className="brand-name">StudentDB</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                        aria-label={`Navigate to ${item.label}`}
                        aria-current={activeTab === item.id ? 'page' : undefined}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="version-info">Ver 2.5</div>
                <div className="status-indicator">
                    <span className="status-dot"></span> Online
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
