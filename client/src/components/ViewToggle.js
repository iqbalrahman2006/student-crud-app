import React from 'react';
import '../App.css';

const ViewToggle = ({ viewMode, setViewMode }) => {
    return (
        <div className="view-toggle" style={{ display: 'flex', alignItems: 'center', background: '#e2e8f0', borderRadius: '8px', padding: '4px', marginLeft: 'auto', marginRight: '20px' }}>
            <button
                className={`button-toggle ${viewMode === 'consolidated' ? 'active' : ''}`}
                style={{
                    border: 'none',
                    background: viewMode === 'consolidated' ? 'white' : 'transparent',
                    color: viewMode === 'consolidated' ? '#4f46e5' : '#64748b',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'consolidated' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease'
                }}
                onClick={() => setViewMode('consolidated')}
            >
                📊 Consolidated
            </button>
            <button
                className={`button-toggle ${viewMode === 'detailed' ? 'active' : ''}`}
                style={{
                    border: 'none',
                    background: viewMode === 'detailed' ? 'white' : 'transparent',
                    color: viewMode === 'detailed' ? '#4f46e5' : '#64748b',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'detailed' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease'
                }}
                onClick={() => setViewMode('detailed')}
            >
                📑 Detailed
            </button>
        </div>
    );
};

export default ViewToggle;
