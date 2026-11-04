/* eslint-disable react-refresh/only-export-components -- context module exports its hook alongside the provider */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Toast from '../components/ui/Toast';

const ToastContext = createContext(null);
let nextId = 0;

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++nextId;
    setToasts((prev) => [...prev.slice(-2), { id, message, type, duration }]); // max 3 on screen
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toasts announce themselves (role=status/alert); the region stays mounted. */}
      <div
        role="region"
        aria-label="Status messages"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-toast flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6"
      >
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
