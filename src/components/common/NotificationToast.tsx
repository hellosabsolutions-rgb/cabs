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

  return (
    <div
      className="notif-toast-container"
      role="alert"
      aria-live="assertive"
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 9999,
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
        background: 'var(--surface-overlay, rgba(26, 31, 46, 0.95))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        cursor: 'pointer',
        animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '4px',
          background:
            activeToast.priority === 'critical'
              ? 'var(--danger)'
              : activeToast.priority === 'warning'
              ? 'var(--warning)'
              : activeToast.priority === 'success'
              ? 'var(--success)'
              : 'var(--accent)'
        }}
      />

      <div
        style={{
          padding: '8px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {CATEGORY_ICONS[activeToast.category] || <Info size={18} color="var(--accent)" />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          {getPriorityIcon()}
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {activeToast.title}
          </span>
        </div>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-dim)',
            lineHeight: 1.4,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {activeToast.message}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          dismissToast();
        }}
        aria-label="Close notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-dim)',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s ease'
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
};
