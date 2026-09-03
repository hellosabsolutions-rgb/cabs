import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastType } from '../../types/fleet';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useFleet();

  if (!toasts || toasts.length === 0) return null;

  const renderIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--accent)" className="toast-icon" />;
      case 'error':
        return <AlertCircle size={18} color="var(--danger)" className="toast-icon" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--warning)" className="toast-icon" />;
      case 'info':
      default:
        return <Info size={18} color="#38bdf8" className="toast-icon" />;
    }
  };

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast-item ${toast.type}`}>
          {renderIcon(toast.type)}
          <div className="toast-content">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div className="toast-message">{toast.message}</div>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => dismissToast(toast.id)}
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
