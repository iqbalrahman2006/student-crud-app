import React from 'react';
import '../App.css';

/**
 * TopBar Component
 * 
 * Renders the top header of the application workspace.
 * Displays the dynamic page title based on the active context.
 * Shows the user profile/avatar section.
 */
const TopBar = ({ activeTab }) => {

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

            <div className="top-bar-actions">
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
