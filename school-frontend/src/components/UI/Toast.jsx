import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <FaCheckCircle className="text-xl" />,
    error: <FaExclamationCircle className="text-xl" />,
    info: <FaInfoCircle className="text-xl" />,
  };

  const colors = {
    success: {
      bg: 'var(--color-success)',
      text: 'white',
    },
    error: {
      bg: 'var(--color-error)',
      text: 'white',
    },
    info: {
      bg: 'var(--color-primary)',
      text: 'white',
    },
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg animate-slideIn min-w-[300px] max-w-md"
      style={{
        backgroundColor: colors[type].bg,
        color: colors[type].text,
      }}
    >
      <div>{icons[type]}</div>
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="hover:opacity-75 transition-opacity"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Toast;
