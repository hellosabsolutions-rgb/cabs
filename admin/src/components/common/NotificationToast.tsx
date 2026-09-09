import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  ShieldAlert,
  Wrench,
  Truck,
  IndianRupee,
  Calendar,
  Info,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  compliance: <ShieldAlert size={18} color="var(--danger)" />,
  maintenance: <Wrench size={18} color="var(--warning)" />,
  fleet: <Truck size={18} color="var(--accent)" />,
  financial: <IndianRupee size={18} color="var(--success)" />,
  bookings: <Calendar size={18} color="#9061f9" />,
  system: <Info size={18} color="var(--accent)" />
};

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast, markRead } = useNotifications();
  const navigate = useNavigate();

  if (!activeToast) return null;

  const handleClick = () => {
    markRead(activeToast.id);
    dismissToast();
    if (activeToast.link) {
      navigate(activeToast.link);
    } else {
      navigate('/notifications');
    }
  };

  const getPriorityIcon = () => {
    if (activeToast.priority === 'critical') return <AlertTriangle size={14} color="var(--danger)" />;
    if (activeToast.priority === 'warning') return <AlertTriangle size={14} color="var(--warning)" />;
    if (activeToast.priority === 'success') return <CheckCircle2 size={14} color="var(--success)" />;
    return <Info size={14} color="var(--accent)" />;
  };

  const stripeColor =
    activeToast.priority === 'critical'
      ? 'var(--danger)'
      : activeToast.priority === 'warning'
      ? 'var(--warning)'
      : activeToast.priority === 'success'
      ? 'var(--success)'
      : 'var(--accent)';

  return (
    <div
      className="notif-toast-card"
      role="alert"
      aria-live="assertive"
      onClick={handleClick}
    >
      <div
        className="notif-toast-stripe"
        style={{ background: stripeColor }}
      />

      <div className="notif-toast-icon-wrap">
        {CATEGORY_ICONS[activeToast.category] || <Info size={18} color="var(--accent)" />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          {getPriorityIcon()}
          <span className="notif-toast-title">
            {activeToast.title}
          </span>
        </div>
        <p className="notif-toast-desc">
          {activeToast.message}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          dismissToast();
        }}
        aria-label="Close notification"
        className="notif-toast-close"
      >
        <X size={15} />
      </button>
    </div>
  );
};
