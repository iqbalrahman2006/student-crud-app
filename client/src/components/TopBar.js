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
const TopBar = ({ activeTab, viewMode, setViewMode }) => {

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
                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-name">Admin User</span>
                        <span className="user-role">Administrator</span>
                    </div>
                    <div className="avatar">AD</div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
