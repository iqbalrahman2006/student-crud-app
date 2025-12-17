import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = type === 'error' ? '#f8d7da' : '#d1e7dd';
  const textColor = type === 'error' ? '#842029' : '#0f5132';

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      backgroundColor: bgColor,
      color: textColor,
      padding: '12px 20px',
      borderRadius: 6,
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      fontWeight: 600,
      zIndex: 1000
    }}>
      {message}
    </div>
  );
};

export default Toast;
