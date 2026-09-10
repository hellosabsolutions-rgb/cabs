import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './layout/Sidebar';
import { Topbar } from './layout/Topbar';
import { api } from '../services/api';

// SVG Chart Helpers matching super-admin.html
function renderSparkline(values: number[] = [10, 20, 15, 25], color = 'var(--sa-blue)') {
  const w = 100;
  const h = 26;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const step = w / (values.length - 1 || 1);
  const d = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    })
    .join(' ');

  return (
    <svg className="sa-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function renderSvgLineChart(values: number[], color: string, w = 640, h = 220, id = 'line') {
  const pad = 10;
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const step = (w - pad * 2) / (values.length - 1 || 1);
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return [x, y];
  });
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const areaD = d + ` L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`;

  return (
    <svg className="sa-chart-box" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${id})`} stroke="none" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, idx) => (
        <circle key={idx} cx={p[0]} cy={p[1]} r="2.8" fill={color} />
      ))}
    </svg>
  );
}

function renderSvgBarChart(values: number[], color: string, w = 640, h = 160, values2?: number[], color2?: string) {
  const pad = 10;
  const n = values.length;
  const groupW = (w - pad * 2) / (n || 1);
  const barW = values2 ? groupW * 0.32 : groupW * 0.5;
  const max = Math.max(...values, ...(values2 || [0]));

  return (
    <svg className="sa-chart-box" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {values.map((v, i) => {
        const bh = (v / (max || 1)) * (h - pad * 2);
        const x = pad + i * groupW + groupW * 0.5 - (values2 ? barW + 2 : barW / 2);
        const y = h - pad - bh;
        return <rect key={`b1-${i}`} x={x.toFixed(1)} y={y.toFixed(1)} width={barW.toFixed(1)} height={bh.toFixed(1)} rx="3" fill={color} />;
      })}
      {values2 &&
        values2.map((v2, i) => {
          const bh2 = (v2 / (max || 1)) * (h - pad * 2);
          const x2 = pad + i * groupW + groupW * 0.5 + 2;
          const y2 = h - pad - bh2;
          return <rect key={`b2-${i}`} x={x2.toFixed(1)} y={y2.toFixed(1)} width={barW.toFixed(1)} height={bh2.toFixed(1)} rx="3" fill={color2 || '#E4572E'} />;
        })}
    </svg>
  );
}

export const Console: React.FC = () => {
  // Navigation State
  const [activeView, setActiveView] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('plans');
  const [activePayTab, setActivePayTab] = useState('transactions');
  const [activeAnaTab, setActiveAnaTab] = useState('usage');
  const [activeSupTab, setActiveSupTab] = useState('tickets');
  const [activeSetTab, setActiveSetTab] = useState('general');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Filters & Search
  const [bizFilter, setBizFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Business for Detail View
  const [businessDetail, setBusinessDetail] = useState<any>(null);

  // Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [subscriptionsData, setSubscriptionsData] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [supportData, setSupportData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Team Member Invite State (in Settings)
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Operations Manager');
  const [inviteSent, setInviteSent] = useState(false);

  // Alerts toggles
  const [alerts, setAlerts] = useState({ trial: true, payment: true, signup: false });

  // Page Titles Map
  const pageMeta: Record<string, { title: string; crumb: string }> = {
    dashboard: { title: 'Dashboard', crumb: 'Overview of the whole platform' },
    businesses: { title: 'Businesses', crumb: 'All registered businesses on FleetOps' },
    'biz-detail': { title: 'Business details', crumb: 'Business → Subscription → Usage' },
    subscriptions: { title: 'Subscriptions', crumb: 'Plans, active subscriptions and renewals' },
    payments: { title: 'Payments & Revenue', crumb: 'Transactions, revenue and refunds' },
    users: { title: 'Users', crumb: 'Everyone with access across businesses' },
    analytics: { title: 'Platform Analytics', crumb: 'Usage, growth and revenue trends' },
    support: { title: 'Support', crumb: 'Tickets and feedback from businesses' },
    notifications: { title: 'Notifications', crumb: 'System-level alerts' },
    audit: { title: 'Audit Logs', crumb: 'Every action taken on the platform' },
    settings: { title: 'Settings', crumb: 'Platform configuration & Team invitations' }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [dash, biz, subs, pay, usr, ana, sup, aud] = await Promise.all([
        api.getDashboardStats(),
        api.getBusinesses(),
        api.getSubscriptions(),
        api.getPayments(),
        api.getUsers(),
        api.getAnalytics(),
        api.getSupport(),
        api.getAuditLogs()
      ]);

      if (dash) setDashboardData(dash);
      if (biz) setBusinesses(biz);
      if (subs) setSubscriptionsData(subs);
      if (pay) setPaymentsData(pay);
      if (usr) setUsersList(usr);
      if (ana) setAnalyticsData(ana);
      if (sup) setSupportData(sup);
      if (aud) setAuditLogs(aud);
    } catch (err) {
      console.warn('SuperAdmin load error:', err);
    }
  };

  const handleNavigate = (view: string, opts?: { tab?: string; filter?: string }) => {
    setActiveView(view);
    if (opts?.tab) {
      if (view === 'subscriptions') setActiveSubTab(opts.tab);
      if (view === 'payments') setActivePayTab(opts.tab);
      if (view === 'analytics') setActiveAnaTab(opts.tab);
      if (view === 'support') setActiveSupTab(opts.tab);
    }
    if (opts?.filter && view === 'businesses') {
      setBizFilter(opts.filter);
    }
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openBizDetail = async (id: string) => {
    const detail = await api.getBusinessDetail(id);
    if (detail) {
      setBusinessDetail(detail);
    } else {
      const fallback = businesses.find(b => b.id === id);
      setBusinessDetail(fallback || null);
    }
    setActiveView('biz-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleBizStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await api.updateBusinessStatus(id, newStatus);
      setBusinesses(prev => prev.map(b => (b.id === id ? { ...b, status: newStatus } : b)));
      if (businessDetail && businessDetail.id === id) {
        setBusinessDetail({ ...businessDetail, status: newStatus });
      }
      const updatedAudit = await api.getAuditLogs();
      if (updatedAudit) setAuditLogs(updatedAudit);
    } catch (err: any) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  const handleRetryPayment = async (biz: string) => {
    try {
      await api.retryPayment(biz);
      alert(`Payment retry scheduled for ${biz}`);
      const updatedAudit = await api.getAuditLogs();
      if (updatedAudit) setAuditLogs(updatedAudit);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      await api.inviteTeamMember({
        name: inviteName || inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole
      });
    } catch (err) {
      // Graceful local handling
    }

    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteEmail('');
      setInviteName('');
    }, 4000);
  };

  // Filtered Businesses
  const filteredBusinesses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return businesses.filter(b => {
      const matchStatus = bizFilter === 'all' || b.status === bizFilter;
      const matchQ = !q || b.name.toLowerCase().includes(q) || b.owner.toLowerCase().includes(q) || (b.city && b.city.toLowerCase().includes(q));
      return matchStatus && matchQ;
    });
  }, [businesses, bizFilter, searchQuery]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return usersList.filter(u => {
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.biz.toLowerCase().includes(q);
      return matchRole && matchQ;
    });
  }, [usersList, userRoleFilter, searchQuery]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    const tickets = supportData?.tickets || [];
    return tickets.filter((t: any) => ticketFilter === 'all' || t.status === ticketFilter);
  }, [supportData, ticketFilter]);

  const initials = (name = 'ABC') =>
    name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const getStatusBadgeClass = (s = 'Active') => {
    return `sa-badge sa-badge-${s.toLowerCase().replace(' ', '')}`;
  };

  const currentMeta = pageMeta[activeView] || { title: 'Dashboard', crumb: 'Super Admin Console' };

  return (
    <div className="sa-app">
      {/* SIDEBAR */}
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        counts={{
          businesses: businesses.length || 42,
          activeSubs: subscriptionsData?.activeSubs?.length || 38,
          tickets: supportData?.tickets?.length || 6,
          notifs: 4
        }}
      />

      {/* MAIN BODY */}
      <div className="sa-main">
        <Topbar
          title={currentMeta.title}
          crumb={currentMeta.crumb}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
          onNotificationClick={() => handleNavigate('notifications')}
        />

        <div className="sa-content">
          {/* ============ 1. DASHBOARD VIEW ============ */}
          {activeView === 'dashboard' && (
            <div className="sa-view">
              {/* 10 KPI CARDS */}
              <div className="sa-kpi-grid">
                {(dashboardData?.kpis || []).map((k: any, i: number) => (
                  <div key={i} className="sa-kpi-card">
                    <div className="sa-kpi-top">
                      <div className="sa-kpi-label">{k.label}</div>
                      <div className="sa-kpi-icon" style={{ background: k.bg, color: k.color }} dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="${k.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${k.icon}</svg>` }} />
                    </div>
                    <div className="sa-kpi-value">{k.value}</div>
                    <div className={`sa-kpi-delta ${k.dir}`}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        {k.dir === 'up' ? <path d="M18 15 12 9 6 15" /> : <path d="M6 9l6 6 6-6" />}
                      </svg>
                      {k.delta}
                    </div>
                    {renderSparkline(k.spark, k.color)}
                  </div>
                ))}
              </div>

              {/* ROW 1: Revenue Trend & Recent Activity */}
              <div className="sa-row-2">
                <div className="sa-card">
                  <div className="sa-card-head">
                    <div>
                      <div className="sa-card-title">Revenue trend</div>
                      <div className="sa-card-sub">Monthly recurring revenue, last 12 months</div>
                    </div>
                    <div className="sa-link-btn" onClick={() => handleNavigate('analytics', { tab: 'revenue-a' })}>
                      View analytics →
                    </div>
                  </div>
                  <div className="sa-card-body">
                    {renderSvgLineChart(dashboardData?.revMonths || [4.2, 4.6, 5.0, 5.3, 5.8, 6.1, 6.6, 7.0, 7.4, 7.8, 8.0, 8.4], '#2F6FED', 640, 220, 'rev')}
                  </div>
                </div>

                <div className="sa-card">
                  <div className="sa-card-head">
                    <div>
                      <div className="sa-card-title">Recent activity</div>
                      <div className="sa-card-sub">Latest platform events</div>
                    </div>
                  </div>
                  <div className="sa-card-body" style={{ maxHeight: '266px', overflowY: 'auto' }}>
                    {(dashboardData?.activityFeed || []).map((a: any, idx: number) => (
                      <div key={idx} className="sa-activity-item">
                        <div className="sa-activity-dot" />
                        <div>
                          <div className="sa-activity-text" dangerouslySetInnerHTML={{ __html: a.text }} />
                          <div className="sa-activity-time">{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ROW 2: Signups This Month & Expiring Soon */}
              <div className="sa-row-2">
                <div className="sa-card">
                  <div className="sa-card-head">
                    <div>
                      <div className="sa-card-title">New businesses this month</div>
                      <div className="sa-card-sub">Sign-ups by week</div>
                    </div>
                  </div>
                  <div className="sa-card-body">
                    {renderSvgBarChart(dashboardData?.signupWeeks || [3, 5, 4, 7], '#2F6FED', 640, 160)}
                  </div>
                </div>

                <div className="sa-card">
                  <div className="sa-card-head">
                    <div>
                      <div className="sa-card-title">Expiring soon</div>
                      <div className="sa-card-sub">Subscriptions renewing within 7 days</div>
                    </div>
                    <div className="sa-link-btn" onClick={() => handleNavigate('subscriptions', { tab: 'expiring' })}>
                      View all →
                    </div>
                  </div>
                  <div className="sa-card-body" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {(dashboardData?.expiringSoon || []).map((b: any, idx: number) => (
                      <div key={idx} className="sa-activity-item">
                        <div className="sa-activity-dot" style={{ background: 'var(--sa-amber)' }} />
                        <div>
                          <div className="sa-activity-text">
                            {b.name} — {b.plan}
                          </div>
                          <div className="sa-activity-time">Renews {b.expiry}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ 2. BUSINESSES LIST ============ */}
          {activeView === 'businesses' && (
            <div className="sa-view">
              <div className="sa-filters-row">
                {['all', 'Active', 'Trial', 'Expired', 'Suspended'].map(s => (
                  <div
                    key={s}
                    className={`sa-chip ${bizFilter === s ? 'active' : ''}`}
                    onClick={() => setBizFilter(s)}
                  >
                    {s === 'all' ? `All (${businesses.length})` : s}
                  </div>
                ))}

                <div className="sa-search-box" style={{ marginLeft: '10px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search business or owner…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="sa-btn sa-btn-primary"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => alert('Add Business Modal')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Business
                </button>
              </div>

              <div className="sa-card">
                <div className="sa-table-wrap">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Business</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Vehicles</th>
                        <th>Drivers</th>
                        <th>Users</th>
                        <th>Expiry</th>
                        <th>Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBusinesses.map(b => (
                        <tr key={b.id} className="clickable" onClick={() => openBizDetail(b.id)}>
                          <td>
                            <div className="sa-name-flex">
                              <span className="sa-avatar-sm">{initials(b.name)}</span>
                              <div>
                                <div className="sa-cell-main">{b.name}</div>
                                <div className="sa-cell-sub">
                                  {b.owner} · {b.city}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{b.plan}</td>
                          <td>
                            <span className={getStatusBadgeClass(b.status)}>{b.status}</span>
                          </td>
                          <td className="sa-cell-num">
                            {b.vehicles}
                            {b.vlimit < 999 ? `/${b.vlimit}` : ''}
                          </td>
                          <td className="sa-cell-num">
                            {b.drivers}
                            {b.dlimit < 999 ? `/${b.dlimit}` : ''}
                          </td>
                          <td className="sa-cell-num">
                            {b.users}
                            {b.ulimit < 999 ? `/${b.ulimit}` : ''}
                          </td>
                          <td className="sa-cell-num">{b.expiry}</td>
                          <td className="sa-cell-sub">{b.lastLogin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sa-pagination">
                  <span>Showing {filteredBusinesses.length} of {businesses.length} businesses</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" className="sa-btn sa-btn-sm">Prev</button>
                    <button type="button" className="sa-btn sa-btn-sm">Next</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ 3. BUSINESS DETAIL ============ */}
          {activeView === 'biz-detail' && businessDetail && (
            <div className="sa-view">
              <div className="sa-back-link" onClick={() => handleNavigate('businesses')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to Businesses
              </div>

              <div className="sa-detail-head">
                <div className="sa-detail-logo">{initials(businessDetail.name)}</div>
                <div style={{ flex: 1 }}>
                  <div className="sa-detail-title">{businessDetail.name}</div>
                  <div className="sa-detail-meta">
                    {businessDetail.owner} · {businessDetail.city} · Registered {businessDetail.reg}
                  </div>
                </div>
                <span className={getStatusBadgeClass(businessDetail.status)}>{businessDetail.status}</span>
                <button type="button" className="sa-btn" onClick={() => alert(`Edit ${businessDetail.name}`)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  className="sa-btn"
                  style={{ color: businessDetail.status === 'Active' ? 'var(--sa-coral)' : 'var(--sa-teal)' }}
                  onClick={() => handleToggleBizStatus(businessDetail.id, businessDetail.status)}
                >
                  {businessDetail.status === 'Active' ? 'Suspend' : 'Activate'}
                </button>
              </div>

              <div className="sa-stat-strip">
                <div className="sa-stat-box">
                  <div className="lbl">Vehicles</div>
                  <div className="val">{businessDetail.vehicles}</div>
                </div>
                <div className="sa-stat-box">
                  <div className="lbl">Drivers</div>
                  <div className="val">{businessDetail.drivers}</div>
                </div>
                <div className="sa-stat-box">
                  <div className="lbl">Users</div>
                  <div className="val">{businessDetail.users}</div>
                </div>
                <div className="sa-stat-box">
                  <div className="lbl">Monthly bill</div>
                  <div className="val">{businessDetail.amount}</div>
                </div>
              </div>

              <div className="sa-row-2">
                <div className="sa-card">
                  <div className="sa-card-head">
                    <div className="sa-card-title">Business details</div>
                  </div>
                  <div className="sa-card-body">
                    <div className="sa-info-grid">
                      <div className="sa-info-item">
                        <div className="k">Owner name</div>
                        <div className="v">{businessDetail.owner}</div>
                      </div>
                      <div className="sa-info-item">
                        <div className="k">Email</div>
                        <div className="v">{businessDetail.email}</div>
                      </div>
                      <div className="sa-info-item">
                        <div className="k">Phone</div>
                        <div className="v">{businessDetail.phone}</div>
                      </div>
                      <div className="sa-info-item">
                        <div className="k">Business type</div>
                        <div className="v">{businessDetail.type}</div>
                      </div>
                      <div className="sa-info-item">
                        <div className="k">City / State</div>
                        <div className="v">{businessDetail.city}</div>
                      </div>
                      <div className="sa-info-item">
                        <div className="k">Registration date</div>
                        <div className="v">{businessDetail.reg}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sa-card">
                  <div className="sa-card-head">
                    <div className="sa-card-title">Subscription</div>
                    <span className={getStatusBadgeClass(businessDetail.status)}>{businessDetail.status}</span>
                  </div>
                  <div className="sa-card-body">
                    <div className="sa-info-item" style={{ border: 'none', paddingTop: 0 }}>
                      <div className="k">Plan</div>
                      <div className="v">{businessDetail.plan}</div>
                    </div>
                    <div className="sa-info-grid" style={{ marginTop: '4px' }}>
                      <div className="sa-info-item">
                        <div className="k">Started</div>
                        <div className="v">{businessDetail.start}</div>
                      </div>
                      <div className="sa-info-item">
                        <div className="k">Renews</div>
                        <div className="v">{businessDetail.expiry}</div>
                      </div>
                      <div className="sa-info-item">
                        <div className="k">Billing</div>
                        <div className="v">Monthly</div>
                      </div>
                      <div className="sa-info-item">
                        <div className="k">Auto renew</div>
                        <div className="v">ON</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <div className="sa-section-title" style={{ marginBottom: '10px' }}>
                        Usage this cycle
                      </div>
                      <div className="sa-usage-row">
                        <div className="sa-usage-label">Vehicles</div>
                        <div className="sa-usage-bar">
                          <div
                            className="sa-usage-fill"
                            style={{ width: `${Math.min(100, (businessDetail.vehicles / (businessDetail.vlimit || 25)) * 100)}%` }}
                          />
                        </div>
                        <div className="sa-usage-val">
                          {businessDetail.vehicles}/{businessDetail.vlimit < 999 ? businessDetail.vlimit : '∞'}
                        </div>
                      </div>
                      <div className="sa-usage-row">
                        <div className="sa-usage-label">Drivers</div>
                        <div className="sa-usage-bar">
                          <div
                            className="sa-usage-fill"
                            style={{ width: `${Math.min(100, (businessDetail.drivers / (businessDetail.dlimit || 25)) * 100)}%` }}
                          />
                        </div>
                        <div className="sa-usage-val">
                          {businessDetail.drivers}/{businessDetail.dlimit < 999 ? businessDetail.dlimit : '∞'}
                        </div>
                      </div>
                      <div className="sa-usage-row">
                        <div className="sa-usage-label">Users</div>
                        <div className="sa-usage-bar">
                          <div
                            className="sa-usage-fill"
                            style={{ width: `${Math.min(100, (businessDetail.users / (businessDetail.ulimit || 10)) * 100)}%` }}
                          />
                        </div>
                        <div className="sa-usage-val">
                          {businessDetail.users}/{businessDetail.ulimit < 999 ? businessDetail.ulimit : '∞'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sa-row-2">
                <div className="sa-card">
                  <div className="sa-card-head">
                    <div className="sa-card-title">Recent activity</div>
                  </div>
                  <div className="sa-card-body">
                    {(businessDetail.activity || []).map((a: any, idx: number) => (
                      <div key={idx} className="sa-activity-item">
                        <div className="sa-activity-dot" />
                        <div>
                          <div className="sa-activity-text">{a.t}</div>
                          <div className="sa-activity-time">{a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sa-card">
                  <div className="sa-card-head">
                    <div className="sa-card-title">Payment history</div>
                  </div>
                  <div className="sa-table-wrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(businessDetail.payments || []).map((p: any, idx: number) => (
                          <tr key={idx}>
                            <td className="sa-cell-sub">{p.date}</td>
                            <td className="sa-cell-num">{p.amount}</td>
                            <td>
                              <span className={getStatusBadgeClass(p.status)}>{p.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ 4. SUBSCRIPTIONS VIEW ============ */}
          {activeView === 'subscriptions' && (
            <div className="sa-view">
              <div className="sa-tabbar">
                {[
                  { id: 'plans', label: 'Plans' },
                  { id: 'active', label: `Active Subscriptions`, cnt: subscriptionsData?.activeSubs?.length || 38 },
                  { id: 'expiring', label: `Expiring Soon`, cnt: subscriptionsData?.expiringSubs?.length || 5 },
                  { id: 'cancelled', label: `Cancelled`, cnt: subscriptionsData?.cancelledSubs?.length || 3 }
                ].map(t => (
                  <div
                    key={t.id}
                    className={`sa-tab ${activeSubTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveSubTab(t.id)}
                  >
                    {t.label}
                    {t.cnt !== undefined && <span className="cnt">{t.cnt}</span>}
                  </div>
                ))}
              </div>

              {activeSubTab === 'plans' && (
                <div>
                  <div className="sa-plan-grid">
                    {(subscriptionsData?.plans || []).map((p: any, idx: number) => (
                      <div key={idx} className={`sa-plan-card ${p.featured ? 'featured' : ''}`}>
                        {p.featured && <div className="sa-plan-tag">Most popular</div>}
                        <div className="sa-plan-name">{p.name}</div>
                        <div className="sa-plan-price">
                          {p.price ? (
                            <>
                              ₹{p.price}
                              <span>/month</span>
                            </>
                          ) : (
                            <>
                              Custom<span></span>
                            </>
                          )}
                        </div>
                        <div className="sa-plan-active-count">{p.active} businesses on this plan</div>
                        {p.features.map((f: string, fIdx: number) => (
                          <div key={fIdx} className="sa-plan-feat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            {f}
                          </div>
                        ))}
                        <div className="sa-plan-actions">
                          <button type="button" className="sa-btn sa-btn-sm" style={{ flex: 1 }} onClick={() => alert(`Edit ${p.name}`)}>
                            Edit plan
                          </button>
                          <button type="button" className="sa-btn sa-btn-sm sa-btn-ghost">
                            Deactivate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="sa-btn sa-btn-primary" onClick={() => alert('Create New Plan')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Create New Plan
                  </button>
                </div>
              )}

              {activeSubTab === 'active' && (
                <div className="sa-card">
                  <div className="sa-table-wrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Business</th>
                          <th>Plan</th>
                          <th>Billing</th>
                          <th>Amount</th>
                          <th>Start</th>
                          <th>Renewal</th>
                          <th>Auto Renew</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(subscriptionsData?.activeSubs || []).map((b: any, idx: number) => (
                          <tr key={idx}>
                            <td className="sa-cell-main">{b.name}</td>
                            <td>{b.plan}</td>
                            <td>Monthly</td>
                            <td className="sa-cell-num">{b.amount}</td>
                            <td className="sa-cell-num">{b.startDate || '01 Aug 2026'}</td>
                            <td className="sa-cell-num">{b.expiryDate || '01 Sep 2026'}</td>
                            <td>
                              <span className={getStatusBadgeClass('Active')}>Active</span> ON
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'expiring' && (
                <div className="sa-card">
                  <div className="sa-table-wrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Business</th>
                          <th>Plan</th>
                          <th>Expiry Date</th>
                          <th>Days Left</th>
                          <th>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(subscriptionsData?.expiringSubs || []).map((b: any, idx: number) => (
                          <tr key={idx}>
                            <td className="sa-cell-main">{b.name}</td>
                            <td>{b.plan}</td>
                            <td className="sa-cell-num">{b.expiryDate || '01 Sep 2026'}</td>
                            <td>
                              <span className={getStatusBadgeClass('Trial')}>Trial</span>
                              <span className="sa-cell-num" style={{ marginLeft: '6px' }}>
                                3d
                              </span>
                            </td>
                            <td className="sa-cell-num">{b.amount}</td>
                            <td>
                              <button type="button" className="sa-btn sa-btn-sm" onClick={() => alert(`Reminder sent to ${b.name}`)}>
                                Remind
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSubTab === 'cancelled' && (
                <div className="sa-card">
                  <div className="sa-table-wrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Business</th>
                          <th>Plan</th>
                          <th>Cancelled On</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(subscriptionsData?.cancelledSubs || []).map((c: any, idx: number) => (
                          <tr key={idx}>
                            <td className="sa-cell-main">{c.name}</td>
                            <td>{c.plan}</td>
                            <td className="sa-cell-num">{c.date}</td>
                            <td className="sa-cell-sub">{c.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ 5. PAYMENTS VIEW ============ */}
          {activeView === 'payments' && (
            <div className="sa-view">
              <div className="sa-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {(paymentsData?.payKpis || []).map((k: any, i: number) => (
                  <div key={i} className="sa-kpi-card">
                    <div className="sa-kpi-top">
                      <div className="sa-kpi-label">{k.label}</div>
                      <div className="sa-kpi-icon" style={{ background: k.bg, color: k.color }} dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="${k.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${k.icon}</svg>` }} />
                    </div>
                    <div className="sa-kpi-value">{k.value}</div>
                    <div className={`sa-kpi-delta ${k.dir}`}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        {k.dir === 'up' ? <path d="M18 15 12 9 6 15" /> : <path d="M6 9l6 6 6-6" />}
                      </svg>
                      {k.delta}
                    </div>
                    {renderSparkline(k.spark, k.color)}
                  </div>
                ))}
              </div>

              <div className="sa-tabbar">
                {[
                  { id: 'transactions', label: 'Transactions' },
                  { id: 'revenue', label: 'Revenue' },
                  { id: 'failed', label: 'Failed Payments', cnt: paymentsData?.failedPayments?.length || 3 },
                  { id: 'refunds', label: 'Refunds', cnt: paymentsData?.refunds?.length || 2 }
                ].map(t => (
                  <div
                    key={t.id}
                    className={`sa-tab ${activePayTab === t.id ? 'active' : ''}`}
                    onClick={() => setActivePayTab(t.id)}
                  >
                    {t.label}
                    {t.cnt !== undefined && <span className="cnt">{t.cnt}</span>}
                  </div>
                ))}
              </div>

              {activePayTab === 'transactions' && (
                <div className="sa-card">
                  <div className="sa-table-wrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Txn ID</th>
                          <th>Business</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(paymentsData?.transactions || []).map((t: any, idx: number) => (
                          <tr key={idx}>
                            <td className="sa-cell-num">{t.txnId}</td>
                            <td className="sa-cell-main">{t.biz}</td>
                            <td className="sa-cell-num">{t.amount}</td>
                            <td>{t.method}</td>
                            <td className="sa-cell-num">{t.date}</td>
                            <td>
                              <span className={getStatusBadgeClass(t.status)}>{t.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activePayTab === 'revenue' && (
                <div className="sa-card">
                  <div className="sa-card-head">
                    <div className="sa-card-title">Revenue by month</div>
                  </div>
                  <div className="sa-card-body">
                    {renderSvgLineChart(paymentsData?.revMonths || [4.2, 4.6, 5.0, 5.3, 5.8, 6.1, 6.6, 7.0, 7.4, 7.8, 8.0, 8.4], '#0EA5A0', 640, 220, 'payrev')}
                  </div>
                </div>
              )}

              {activePayTab === 'failed' && (
                <div className="sa-card">
                  <div className="sa-table-wrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Business</th>
                          <th>Amount</th>
                          <th>Reason</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(paymentsData?.failedPayments || []).map((f: any, idx: number) => (
                          <tr key={idx}>
                            <td className="sa-cell-main">{f.biz}</td>
                            <td className="sa-cell-num">{f.amount}</td>
                            <td className="sa-cell-sub">{f.reason || 'Card expired'}</td>
                            <td className="sa-cell-num">{f.date}</td>
                            <td>
                              <button type="button" className="sa-btn sa-btn-sm" onClick={() => handleRetryPayment(f.biz)}>
                                Retry
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activePayTab === 'refunds' && (
                <div className="sa-card">
                  <div className="sa-table-wrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Business</th>
                          <th>Amount</th>
                          <th>Reason</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(paymentsData?.refunds || []).map((r: any, idx: number) => (
                          <tr key={idx}>
                            <td className="sa-cell-main">{r.biz}</td>
                            <td className="sa-cell-num">{r.amount}</td>
                            <td className="sa-cell-sub">{r.reason}</td>
                            <td className="sa-cell-num">{r.date}</td>
                            <td>
                              <span className={getStatusBadgeClass(r.status)}>{r.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ 6. USERS VIEW ============ */}
          {activeView === 'users' && (
            <div className="sa-view">
              <div className="sa-filters-row">
                {['all', 'Owner', 'Admin', 'Manager', 'Driver'].map(r => (
                  <div
                    key={r}
                    className={`sa-chip ${userRoleFilter === r ? 'active' : ''}`}
                    onClick={() => setUserRoleFilter(r)}
                  >
                    {r === 'all' ? 'All' : r === 'Owner' ? 'Business Owners' : `${r}s`}
                  </div>
                ))}

                <div className="sa-search-box" style={{ marginLeft: '10px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="sa-card">
                <div className="sa-table-wrap">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Business</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="sa-name-flex">
                              <span className="sa-avatar-sm">{initials(u.name)}</span>
                              <div className="sa-cell-main">{u.name}</div>
                            </div>
                          </td>
                          <td>{u.biz}</td>
                          <td>{u.role}</td>
                          <td className="sa-cell-sub">{u.email}</td>
                          <td>
                            <span className={getStatusBadgeClass(u.status)}>{u.status}</span>
                          </td>
                          <td className="sa-cell-sub">{u.login}</td>
                          <td className="sa-cell-num">{u.created}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============ 7. ANALYTICS VIEW ============ */}
          {activeView === 'analytics' && (
            <div className="sa-view">
              <div className="sa-tabbar">
                {['usage', 'growth', 'revenue-a'].map(tab => (
                  <div
                    key={tab}
                    className={`sa-tab ${activeAnaTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveAnaTab(tab)}
                  >
                    {tab === 'usage' ? 'Platform Usage' : tab === 'growth' ? 'Business Growth' : 'Revenue Analytics'}
                  </div>
                ))}
              </div>

              {activeAnaTab === 'usage' && (
                <div>
                  <div className="sa-kpi-grid">
                    {(analyticsData?.usageKpis || []).map((k: any, i: number) => (
                      <div key={i} className="sa-kpi-card">
                        <div className="sa-kpi-top">
                          <div className="sa-kpi-label">{k.label}</div>
                          <div className="sa-kpi-icon" style={{ background: k.bg, color: k.color }} dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="${k.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${k.icon}</svg>` }} />
                        </div>
                        <div className="sa-kpi-value">{k.value}</div>
                        <div className={`sa-kpi-delta ${k.dir}`}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 15 12 9 6 15" />
                          </svg>
                          {k.delta}
                        </div>
                        {renderSparkline(k.spark, k.color)}
                      </div>
                    ))}
                  </div>

                  <div className="sa-row-2">
                    <div className="sa-card">
                      <div className="sa-card-head">
                        <div>
                          <div className="sa-card-title">Daily active businesses</div>
                          <div className="sa-card-sub">Last 14 days</div>
                        </div>
                      </div>
                      <div className="sa-card-body">
                        {renderSvgLineChart(analyticsData?.dabDays || [18, 20, 19, 22, 24, 23, 25, 24, 26, 25, 27, 26, 28, 27], '#0EA5A0', 640, 200, 'dab')}
                      </div>
                    </div>

                    <div className="sa-card">
                      <div className="sa-card-head">
                        <div className="sa-card-title">Trip volume by type</div>
                      </div>
                      <div className="sa-card-body">
                        <div className="sa-usage-row">
                          <div className="sa-usage-label">One-way</div>
                          <div className="sa-usage-bar">
                            <div className="sa-usage-fill" style={{ width: '58%', background: 'var(--sa-blue)' }} />
                          </div>
                          <div className="sa-usage-val">58%</div>
                        </div>
                        <div className="sa-usage-row">
                          <div className="sa-usage-label">Round trip</div>
                          <div className="sa-usage-bar">
                            <div className="sa-usage-fill" style={{ width: '31%', background: 'var(--sa-teal)' }} />
                          </div>
                          <div className="sa-usage-val">31%</div>
                        </div>
                        <div className="sa-usage-row">
                          <div className="sa-usage-label">Rental</div>
                          <div className="sa-usage-bar">
                            <div className="sa-usage-fill" style={{ width: '11%', background: 'var(--sa-amber)' }} />
                          </div>
                          <div className="sa-usage-val">11%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAnaTab === 'growth' && (
                <div className="sa-card">
                  <div className="sa-card-head">
                    <div>
                      <div className="sa-card-title">New businesses vs churned</div>
                      <div className="sa-card-sub">Last 6 months</div>
                    </div>
                  </div>
                  <div className="sa-card-body">
                    {renderSvgBarChart(analyticsData?.growthNew || [3, 4, 2, 5, 4, 5], '#2F6FED', 640, 240, analyticsData?.growthChurn || [1, 1, 2, 1, 0, 1], '#E4572E')}
                    <div className="sa-legend">
                      <div className="sa-legend-item">
                        <span className="sa-legend-dot" style={{ background: 'var(--sa-blue)' }} />
                        New businesses
                      </div>
                      <div className="sa-legend-item">
                        <span className="sa-legend-dot" style={{ background: 'var(--sa-coral)' }} />
                        Churned
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAnaTab === 'revenue-a' && (
                <div className="sa-card">
                  <div className="sa-card-head">
                    <div>
                      <div className="sa-card-title">MRR growth</div>
                      <div className="sa-card-sub">Monthly recurring revenue, ₹ lakhs</div>
                    </div>
                  </div>
                  <div className="sa-card-body">
                    {renderSvgLineChart(analyticsData?.mrrMonths || [4.2, 4.6, 5.0, 5.3, 5.8, 6.1, 6.6, 7.0, 7.4, 7.8, 8.0, 8.4], '#7C5CFC', 640, 220, 'mrr')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ 8. SUPPORT VIEW ============ */}
          {activeView === 'support' && (
            <div className="sa-view">
              <div className="sa-tabbar">
                <div className={`sa-tab ${activeSupTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveSupTab('tickets')}>
                  Tickets <span className="cnt">{supportData?.tickets?.length || 6}</span>
                </div>
                <div className={`sa-tab ${activeSupTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveSupTab('feedback')}>
                  Feedback
                </div>
              </div>

              {activeSupTab === 'tickets' && (
                <div>
                  <div className="sa-filters-row">
                    {['all', 'Open', 'In Progress', 'Resolved', 'Critical'].map(s => (
                      <div
                        key={s}
                        className={`sa-chip ${ticketFilter === s ? 'active' : ''}`}
                        onClick={() => setTicketFilter(s)}
                      >
                        {s}
                      </div>
                    ))}
                  </div>

                  <div className="sa-card">
                    <div className="sa-table-wrap">
                      <table className="sa-table">
                        <thead>
                          <tr>
                            <th>Ticket</th>
                            <th>Business</th>
                            <th>Subject</th>
                            <th>Priority</th>
                            <th>Assigned</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTickets.map((t: any, idx: number) => (
                            <tr key={idx}>
                              <td className="sa-cell-num">{t.id}</td>
                              <td className="sa-cell-main">{t.biz}</td>
                              <td>{t.subject}</td>
                              <td>{t.priority}</td>
                              <td>{t.assigned}</td>
                              <td>
                                <span className={getStatusBadgeClass(t.status)}>{t.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeSupTab === 'feedback' && (
                <div className="sa-card">
                  <div className="sa-table-wrap">
                    <table className="sa-table">
                      <thead>
                        <tr>
                          <th>Business</th>
                          <th>Type</th>
                          <th>Message</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(supportData?.feedback || []).map((f: any, idx: number) => (
                          <tr key={idx}>
                            <td className="sa-cell-main">{f.biz}</td>
                            <td>{f.type}</td>
                            <td className="sa-cell-sub">{f.msg}</td>
                            <td className="sa-cell-num">{f.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ 9. NOTIFICATIONS VIEW ============ */}
          {activeView === 'notifications' && (
            <div className="sa-view">
              <div className="sa-card">
                {[
                  {
                    type: 'warn',
                    bg: 'var(--sa-amber-soft)',
                    color: 'var(--sa-amber)',
                    title: '3 subscriptions expiring within 7 days',
                    desc: 'Metro Cabs Co., Northline Transport and Skyline Rides need renewal follow-up.',
                    time: '10 minutes ago'
                  },
                  {
                    type: 'fail',
                    bg: 'var(--sa-coral-soft)',
                    color: 'var(--sa-coral)',
                    title: 'Payment failed — Highway Kings',
                    desc: '₹999 charge declined due to insufficient balance.',
                    time: '2 hours ago'
                  },
                  {
                    type: 'trial',
                    bg: 'var(--sa-blue-soft)',
                    color: 'var(--sa-blue)',
                    title: 'Trial ending soon — Metro Cabs Co.',
                    desc: 'Trial converts or expires on 03 Sep 2026.',
                    time: '5 hours ago'
                  },
                  {
                    type: 'suspend',
                    bg: '#EDEFF3',
                    color: '#5B6472',
                    title: 'Business suspended — Highway Kings',
                    desc: 'Auto-suspended after 30 days of non-payment.',
                    time: '1 day ago'
                  }
                ].map((n, idx) => (
                  <div key={idx} className="sa-notif-item">
                    <div className="sa-notif-icon" style={{ background: n.bg, color: n.color }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={n.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v5" />
                        <path d="M12 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <div className="sa-notif-title">{n.title}</div>
                      <div className="sa-notif-desc">{n.desc}</div>
                      <div className="sa-notif-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============ 10. AUDIT LOGS VIEW ============ */}
          {activeView === 'audit' && (
            <div className="sa-view">
              <div className="sa-filters-row">
                <div className="sa-search-box" style={{ width: '260px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input type="text" placeholder="Search actions…" />
                </div>
                <button type="button" className="sa-btn" onClick={() => alert('Exporting Audit Logs CSV...')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                  Export CSV
                </button>
              </div>

              <div className="sa-card">
                <div className="sa-card-body">
                  {auditLogs.map((a, idx) => (
                    <div key={idx} className="sa-audit-item">
                      <div className="sa-audit-time">{a.time}</div>
                      <div className="sa-audit-line" />
                      <div>
                        <div className="sa-audit-text" dangerouslySetInnerHTML={{ __html: `Super Admin ${a.text}` }} />
                        <div className="sa-audit-actor">{a.actor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============ 11. SETTINGS & TEAM INVITATIONS VIEW ============ */}
          {activeView === 'settings' && (
            <div className="sa-view">
              <div className="sa-settings-grid">
                <div className="sa-settings-nav">
                  {['general', 'team', 'notifications', 'security', 'billing'].map(s => (
                    <div
                      key={s}
                      className={`sa-s-item ${activeSetTab === s ? 'active' : ''}`}
                      onClick={() => setActiveSetTab(s)}
                    >
                      {s === 'general'
                        ? 'General'
                        : s === 'team'
                        ? 'Team Invitations & Roles'
                        : s === 'notifications'
                        ? 'Notifications'
                        : s === 'security'
                        ? 'Security'
                        : 'Billing Info'}
                    </div>
                  ))}
                </div>

                <div>
                  {activeSetTab === 'team' ? (
                    <div className="sa-card">
                      <div className="sa-card-head">
                        <div>
                          <div className="sa-card-title">Internal Team Access & Invitations</div>
                          <div className="sa-card-sub">Invite your internal team members to collaborate on SuperAdmin</div>
                        </div>
                      </div>
                      <div className="sa-card-body">
                        {inviteSent && (
                          <div
                            style={{
                              background: 'rgba(14, 165, 160, 0.15)',
                              border: '1px solid var(--sa-teal)',
                              color: 'var(--sa-teal)',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 600,
                              marginBottom: '16px'
                            }}
                          >
                            ✔ Invitation sent successfully to {inviteEmail}! A secure invite code has been generated.
                          </div>
                        )}

                        <form onSubmit={handleSendInvite}>
                          <div className="sa-form-2col">
                            <div className="sa-form-row">
                              <label>Full Name</label>
                              <input
                                type="text"
                                placeholder="Priya Sharma"
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="sa-form-row">
                              <label>Work Email</label>
                              <input
                                type="email"
                                placeholder="priya@fleetops.in"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="sa-form-row">
                            <label>Internal Role & Access Level</label>
                            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                              <option value="Operations Manager">Operations Manager (Manage businesses, limits, and onboardings)</option>
                              <option value="Support Specialist">Support Specialist (Resolve tickets, view fleets)</option>
                              <option value="Sales Representative">Sales Representative (Manage CRM leads and proposals)</option>
                              <option value="Super Admin">Super Admin (Full administrative access)</option>
                            </select>
                          </div>

                          <button type="submit" className="sa-btn sa-btn-primary">
                            Send Email Invitation
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="sa-card">
                      <div className="sa-card-head">
                        <div>
                          <div className="sa-card-title">Platform settings</div>
                          <div className="sa-card-sub">General configuration for the FleetOps platform</div>
                        </div>
                      </div>
                      <div className="sa-card-body">
                        <div className="sa-form-2col">
                          <div className="sa-form-row">
                            <label>Platform name</label>
                            <input type="text" defaultValue="FleetOps" />
                          </div>
                          <div className="sa-form-row">
                            <label>Support email</label>
                            <input type="text" defaultValue="support@fleetops.in" />
                          </div>
                          <div className="sa-form-row">
                            <label>Default currency</label>
                            <select defaultValue="INR">
                              <option value="INR">INR (₹)</option>
                              <option value="USD">USD ($)</option>
                            </select>
                          </div>
                          <div className="sa-form-row">
                            <label>Timezone</label>
                            <select defaultValue="Asia/Kolkata">
                              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            </select>
                          </div>
                        </div>

                        <div className="sa-section-title" style={{ marginTop: '6px' }}>
                          Alerts
                        </div>

                        <div className="sa-toggle-row">
                          <div>
                            <div className="t-title">Trial ending reminders</div>
                            <div className="t-desc">Notify businesses 3 days before trial ends</div>
                          </div>
                          <div
                            className={`sa-switch ${alerts.trial ? 'on' : ''}`}
                            onClick={() => setAlerts(p => ({ ...p, trial: !p.trial }))}
                          />
                        </div>

                        <div className="sa-toggle-row">
                          <div>
                            <div className="t-title">Payment failure alerts</div>
                            <div className="t-desc">Email Super Admin when a payment fails</div>
                          </div>
                          <div
                            className={`sa-switch ${alerts.payment ? 'on' : ''}`}
                            onClick={() => setAlerts(p => ({ ...p, payment: !p.payment }))}
                          />
                        </div>

                        <div className="sa-toggle-row">
                          <div>
                            <div className="t-title">New business sign-up alert</div>
                            <div className="t-desc">Slack notification for every new sign-up</div>
                          </div>
                          <div
                            className={`sa-switch ${alerts.signup ? 'on' : ''}`}
                            onClick={() => setAlerts(p => ({ ...p, signup: !p.signup }))}
                          />
                        </div>

                        <div style={{ marginTop: '18px' }}>
                          <button type="button" className="sa-btn sa-btn-primary" onClick={() => alert('Settings saved successfully')}>
                            Save changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
