import React from 'react';
import '../App.css';
import ViewToggle from './ViewToggle';

/**
 * TopBar Component
 * 
 * Renders the top header of the application workspace.
 * Displays the dynamic page title based on the active context.
 * Shows the user profile/avatar section.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * TopBar Component
 * 
 * Renders the top header of the application workspace.
 * Displays the dynamic page title based on the active context.
 * Shows the user profile/avatar section.
 */
const TopBar = ({ activeTab, viewMode, setViewMode }) => {
    const { user, logout } = useAuth() || {}; // Safe destructure if Context missing

    // Helper to determine the display title
    const getPageTitle = (tab) => {
        switch (tab) {
            case 'students':
                return 'Student Directory';
            case 'dashboard':
                return 'Dashboard Overview';
            case 'reports':
                return 'Analytics & Reports';
            case 'settings':
                return 'System Settings';
            default:
                return 'Application';
        }
    };

    return (
        <header className="top-bar">
            <div className="title-section">
                <h2 className="page-title">{getPageTitle(activeTab)}</h2>
                <div className="breadcrumbs">
                    <span>Home</span> / <span className="current">{activeTab}</span>
                </div>
            </div>

            {/* View Toggle Integration */}
            {viewMode && setViewMode && (
                <div style={{ marginLeft: 'auto', marginRight: '20px' }}>
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                </div>
            )}

            <div className="top-bar-actions" style={{ marginLeft: '0' }}>
                {user ? (
                    <div className="user-profile">
                        <span className="user-info" style={{ marginRight: '10px', color: '#64748b', fontSize: '14px' }}>
                            Logged in as <strong>{user.name}</strong> ({user.role})
                        </span>
                        <div className="avatar" style={{ marginRight: '10px' }}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <button
                            onClick={logout}
                            style={{
                                background: 'transparent',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <button style={{
                            background: '#6366f1',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}>
                            Login
                        </button>
                    </Link>
                )}
            </div>
        </header>
    );
};

export default TopBar;
