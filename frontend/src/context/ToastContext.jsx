import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // addToast(message, type, duration)
  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };

    setToasts((prevToasts) => [...prevToasts, newToast]);
    return id;
  }, []);

  const confirmToast = useCallback((message) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      const onConfirm = () => {
        removeToast(id);
        resolve(true);
      };
      const onCancel = () => {
        removeToast(id);
        resolve(false);
      };

      const newToast = {
        id,
        message,
        type: 'confirm',
        duration: Infinity,
        onConfirm,
        onCancel
      };

      setToasts((prevToasts) => [...prevToasts, newToast]);
    });
  }, [removeToast]);

  const contextValue = useMemo(() => ({
    toasts,
    addToast,
    confirmToast,
    removeToast,
  }), [toasts, addToast, confirmToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
