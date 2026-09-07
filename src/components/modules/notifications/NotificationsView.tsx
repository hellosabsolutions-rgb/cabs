import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '../../../context/FleetContext';
import { useNotifications, NotificationCategory, NotificationPriority } from '../../../context/NotificationContext';
import { api } from '../../../services/api';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';
import {
  Bell,
  ShieldAlert,
  Wrench,
  Truck,
  Users,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Navigation,
  Fuel,
  Clock,
  CheckCheck,
  Trash2,
  RefreshCw,
  Zap,
  Radio,
  ExternalLink
} from 'lucide-react';

type NotifCategory = 'all' | 'compliance' | 'maintenance' | 'fleet' | 'financial' | 'bookings' | 'system';

interface CombinedNotification {
  id: string;
  category: NotifCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  isBackend: boolean;
  link?: string | null;
  icon: React.ReactNode;
}

const CATEGORY_LABELS: Record<Exclude<NotifCategory, 'all'>, string> = {
  compliance: 'Compliance',
  maintenance: 'Maintenance',
  fleet: 'Fleet',
  financial: 'Financial',
  bookings: 'Bookings',
  system: 'System'
};

const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; bg: string; label: string }> = {
  critical: { color: 'var(--danger)', bg: 'var(--danger-bg)', label: 'Critical' },
  warning: { color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Warning' },
  info: { color: 'var(--accent)', bg: 'var(--accent-dim)', label: 'Info' },
  success: { color: 'var(--success)', bg: 'rgba(38,184,216,0.1)', label: 'Success' },
};

function formatRelativeTime(dateInput: string | Date | number): string {
  const date = typeof dateInput === 'number'
    ? new Date(Date.now() - dateInput * 60 * 1000)
    : new Date(dateInput);

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 45) return 'Just now';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const NotificationsView: React.FC = () => {
  const navigate = useNavigate();
  const {
    complianceStats,
    vehicles,
    drivers,
    maintenanceRecords,
    trips,
    bookings,
  } = useFleet();

  const {
    notifications: backendNotifications,
    unreadCount: backendUnreadCount,
    isConnected,
    isLoading: backendLoading,
    markRead: markBackendRead,
    markAllRead: markBackendAllRead,
    deleteNotification: deleteBackendNotification,
    clearAll: clearBackendAll,
    refreshNotifications,
  } = useNotifications();

  const [activeCategory, setActiveCategory] = useState<NotifCategory>('all');
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  const getCategoryDefaultRoute = (category: string): string => {
    switch (category) {
      case 'bookings': return '/bookings';
      case 'compliance': return '/compliance';
      case 'maintenance': return '/maintenance';
      case 'fleet': return '/vehicles';
      case 'financial': return '/fastag';
      case 'system': return '/profile';
      default: return '/dashboard';
    }
  };

  // Combine backend persistent notifications with fleet calculated alerts
  const combinedNotifications = useMemo<CombinedNotification[]>(() => {
    const list: CombinedNotification[] = [];

    // 1. First add backend notifications (these are real-time & persistent)
    backendNotifications.forEach((n) => {
      let icon = <Info size={16} />;
      if (n.category === 'compliance') icon = <ShieldAlert size={16} />;
      else if (n.category === 'maintenance') icon = <Wrench size={16} />;
      else if (n.category === 'fleet') icon = <Truck size={16} />;
      else if (n.category === 'financial') icon = <IndianRupee size={16} />;
      else if (n.category === 'bookings') icon = <Navigation size={16} />;

      list.push({
        id: n.id,
        category: n.category as NotifCategory,
        priority: n.priority,
        title: n.title,
        message: n.message,
        time: formatRelativeTime(n.createdAt),
        isRead: n.isRead || localReadIds.has(n.id),
        isBackend: true,
        link: n.link || getCategoryDefaultRoute(n.category),
        icon,
      });
    });

    // 2. Add fleet dynamic alerts as auxiliary items with direct deep links
    complianceStats.alerts.slice(0, 6).forEach((alert, i) => {
      const id = `compliance-${i}`;
      list.push({
        id,
        category: 'compliance',
        priority: alert.type === 'late' ? 'critical' : 'warning',
        title: alert.type === 'late' ? 'Document Expired' : 'Document Expiring Soon',
        message: `${alert.who} — ${alert.doc} ${alert.text}`,
        time: formatRelativeTime(i * 45 + 20),
        isRead: localReadIds.has(id),
        isBackend: false,
        link: '/compliance',
        icon: <ShieldAlert size={16} />,
      });
    });

    maintenanceRecords
      .filter((m) => m.status === 'Scheduled' || m.status === 'In Progress')
      .slice(0, 3)
      .forEach((m, i) => {
        const id = `maint-${i}`;
        list.push({
          id,
          category: 'maintenance',
          priority: m.status === 'Scheduled' ? 'warning' : 'info',
          title: m.status === 'In Progress' ? 'Maintenance In Progress' : 'Maintenance Scheduled',
          message: `${m.vehicle} — ${m.type}. Estimated cost ₹${(m.cost || 0).toLocaleString('en-IN')}`,
          time: formatRelativeTime(i * 120 + 60),
          isRead: localReadIds.has(id),
          isBackend: false,
          link: '/maintenance',
          icon: <Wrench size={16} />,
        });
      });

    vehicles
      .filter((v) => v.status === 'Maintenance')
      .slice(0, 2)
      .forEach((v, i) => {
        const id = `vehicle-maint-${i}`;
        list.push({
          id,
          category: 'fleet',
          priority: 'warning',
          title: 'Vehicle in Workshop',
          message: `${v.registrationNumber} (${v.model}) is currently under maintenance.`,
          time: formatRelativeTime(i * 200 + 30),
          isRead: localReadIds.has(id),
          isBackend: false,
          link: '/vehicles',
          icon: <Truck size={16} />,
        });
      });

    // Low FASTag balance
    vehicles
      .filter((v) => (v.fastagBalance || 0) < 500)
      .slice(0, 2)
      .forEach((v, i) => {
        const id = `fastag-low-${i}`;
        list.push({
          id,
          category: 'financial',
          priority: (v.fastagBalance || 0) < 100 ? 'critical' : 'warning',
          title: 'Low FASTag Balance',
          message: `${v.registrationNumber} has a balance of ₹${(v.fastagBalance || 0).toLocaleString('en-IN')}.`,
          time: formatRelativeTime(i * 60 + 15),
          isRead: localReadIds.has(id),
          isBackend: false,
          link: '/fastag',
          icon: <IndianRupee size={16} />,
        });
      });

    return list.filter((n) => !dismissed.has(n.id));
  }, [backendNotifications, localReadIds, complianceStats, maintenanceRecords, vehicles, dismissed]);

  // Filtered by active category
  const filtered = useMemo(() => {
    if (activeCategory === 'all') return combinedNotifications;
    return combinedNotifications.filter((n) => n.category === activeCategory);
  }, [combinedNotifications, activeCategory]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems: paginatedNotifications
  } = usePagination(filtered, 10);

  const totalUnreadCount = combinedNotifications.filter((n) => !n.isRead).length;

  const getCategoryUnreadCount = (cat: Exclude<NotifCategory, 'all'>) =>
    combinedNotifications.filter((n) => n.category === cat && !n.isRead).length;

  // Actions
  const handleMarkAllRead = async () => {
    const allIds = combinedNotifications.map((n) => n.id);
    setLocalReadIds((prev) => new Set([...prev, ...allIds]));
    await markBackendAllRead(activeCategory === 'all' ? undefined : activeCategory);
  };

  const handleMarkRead = async (notif: CombinedNotification) => {
    setLocalReadIds((prev) => new Set([...prev, notif.id]));
    if (notif.isBackend) {
      await markBackendRead(notif.id);
    }
  };

  const handleNotificationClick = async (notif: CombinedNotification) => {
    await handleMarkRead(notif);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleDismiss = async (notif: CombinedNotification) => {
    setDismissed((prev) => new Set([...prev, notif.id]));
    if (notif.isBackend) {
      await deleteBackendNotification(notif.id);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all notifications?')) {
      const allIds = combinedNotifications.map((n) => n.id);
      setDismissed((prev) => new Set([...prev, ...allIds]));
      await clearBackendAll();
    }
  };

  // Trigger test notification through backend queue & socket
  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      await api.post('/notifications/test', {
        category: 'bookings',
        priority: 'success',
        title: 'New VIP Booking Scheduled',
        message: 'Socket.IO queue successfully broadcast real-time booking alert to all dashboard subscribers!'
      });
    } catch (err: any) {
      console.error('Test notification failed:', err);
    } finally {
      setTimeout(() => setIsSendingTest(false), 600);
    }
  };

  const PriorityIcon = ({ priority }: { priority: NotificationPriority }) => {
    const cfg = PRIORITY_CONFIG[priority];
    if (priority === 'critical') return <AlertCircle size={13} color={cfg.color} />;
    if (priority === 'warning') return <AlertTriangle size={13} color={cfg.color} />;
    if (priority === 'success') return <CheckCircle2 size={13} color={cfg.color} />;
    return <Info size={13} color={cfg.color} />;
  };

  const categories: NotifCategory[] = ['all', 'bookings', 'compliance', 'maintenance', 'fleet', 'financial', 'system'];

  return (
    <div className="section active notif-page">
      {/* Page Header */}
      <div className="notif-header">
        <div className="notif-header-left">
          <div className="notif-title-row">
            <h2 className="notif-page-title">Notifications</h2>
            {totalUnreadCount > 0 && (
              <span className="notif-unread-badge">{totalUnreadCount} unread</span>
            )}

            {/* Socket Live Presence Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: 600,
                background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: isConnected ? '#10b981' : '#f59e0b',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
              }}
              title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to Socket.IO...'}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isConnected ? '#10b981' : '#f59e0b',
                  boxShadow: isConnected ? '0 0 6px #10b981' : 'none'
                }}
              />
              {isConnected ? 'Socket.IO Live' : 'Connecting...'}
            </div>
          </div>
          <p className="notif-page-sub">
            Real-time fleet operations, bookings queue, compliance alerts, and financial logs
          </p>
        </div>

        <div className="notif-header-actions" style={{ display: 'flex', gap: '8px' }}>
          {/* Test Realtime Event Button */}
          <button
            className="notif-action-btn"
            onClick={handleSendTestNotification}
            disabled={isSendingTest}
            title="Trigger a live Socket.IO event"
            style={{
              background: 'linear-gradient(135deg, rgba(22, 135, 245, 0.15), rgba(144, 97, 249, 0.15))',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
              fontWeight: 600
            }}
          >
            <Zap size={14} className={isSendingTest ? 'spin-loader' : ''} />
            {isSendingTest ? 'Dispatching...' : 'Test Realtime Alert'}
          </button>

          <button
            className="notif-action-btn"
            onClick={refreshNotifications}
            disabled={backendLoading}
            title="Refresh notifications list"
          >
            <RefreshCw size={14} className={backendLoading ? 'spin-loader' : ''} />
            Sync
          </button>

          <button className="notif-action-btn" onClick={handleMarkAllRead} title="Mark all as read">
            <CheckCheck size={14} />
            Mark all read
          </button>

          <button
            className="notif-action-btn"
            onClick={handleClearAll}
            title="Clear all notifications"
            style={{ color: 'var(--text-dim)' }}
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="notif-tabs">
        {categories.map((cat) => {
          const count = cat === 'all' ? totalUnreadCount : getCategoryUnreadCount(cat as Exclude<NotifCategory, 'all'>);
          return (
            <button
              key={cat}
              className={`notif-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat as Exclude<NotifCategory, 'all'>]}
              {count > 0 && <span className="notif-tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      <div className="notif-list">
        {filtered.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <Bell size={32} />
            </div>
            <div className="notif-empty-title">All caught up!</div>
            <div className="notif-empty-sub">No notifications in this category right now.</div>
          </div>
        ) : (
          paginatedNotifications.map((notif) => {
            const isRead = notif.isRead;
            const cfg = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.info;
            return (
              <div
                key={notif.id}
                className={`notif-item ${isRead ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(notif)}
                style={{ cursor: 'pointer' }}
              >
                {/* Priority stripe */}
                <div className="notif-stripe" style={{ background: cfg.color }} />

                {/* Icon */}
                <div
                  className="notif-icon-wrap"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {notif.icon}
                </div>

                {/* Content */}
                <div className="notif-content">
                  <div className="notif-item-head">
                    <div className="notif-item-title">
                      {notif.title}
                      {!isRead && <span className="notif-dot" />}
                      {notif.isBackend && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '9px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'rgba(22, 135, 245, 0.1)',
                            color: 'var(--accent)',
                            fontWeight: 600,
                            letterSpacing: '0.3px',
                            textTransform: 'uppercase'
                          }}
                        >
                          Live Event
                        </span>
                      )}
                    </div>
                    <div className="notif-item-meta">
                      <PriorityIcon priority={notif.priority} />
                      <span
                        style={{
                          color: cfg.color,
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span className="notif-time">
                        <Clock size={11} />
                        {notif.time}
                      </span>
                    </div>
                  </div>
                  <p className="notif-msg">{notif.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <div className="notif-cat-chip">
                      {CATEGORY_LABELS[notif.category as Exclude<NotifCategory, 'all'>] || notif.category}
                    </div>
                    {notif.link && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--accent)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(22, 135, 245, 0.08)',
                          border: '1px solid rgba(22, 135, 245, 0.18)',
                          transition: 'all 0.15s ease'
                        }}
                        title={`Deep link to ${notif.link}`}
                      >
                        Open {CATEGORY_LABELS[notif.category as Exclude<NotifCategory, 'all'>] || 'Details'} <ExternalLink size={11} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  className="notif-dismiss"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(notif);
                  }}
                  title="Dismiss notification"
                  aria-label="Dismiss"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        itemLabel="notifications"
      />
    </div>
  );
};
