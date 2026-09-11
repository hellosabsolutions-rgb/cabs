import React, { useState, useEffect, useMemo } from 'react';
import { useAgency } from '../../../context/AgencyContext';
import { useFleet } from '../../../context/FleetContext';
import { activitiesApi, ActivityItem, UserActivityStats } from '../../../services/api';
import {
  Activity,
  Users,
  Search,
  RefreshCw,
  Filter,
  Car,
  CalendarCheck,
  Receipt,
  FileText,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Download,
  KeyRound,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  X,
  User,
  Shield,
  Navigation
} from 'lucide-react';
import { StatCard } from '../../common/StatCard';
import { CustomDropdown, CustomDropdownOption } from '../../common/CustomDropdown';

export const ActivityView: React.FC = () => {
  const { currentAgency } = useAgency();
  const { drivers, showToast } = useFleet();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [userStats, setUserStats] = useState<UserActivityStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedActorType, setSelectedActorType] = useState('all');
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(true);

  const agencyId = currentAgency?.id || currentAgency?._id;

  // Fetch activities and user stats
  const fetchData = async () => {
    setIsLoading(true);
    setIsStatsLoading(true);
    try {
      const [actRes, statsRes] = await Promise.all([
        activitiesApi.getAll({
          agencyId: agencyId || undefined,
          limit: 100
        }),
        activitiesApi.getUserStats(agencyId || undefined)
      ]);

      if (actRes?.data) {
        setActivities(actRes.data);
      }
      if (statsRes?.data) {
        setUserStats(statsRes.data);
      }
    } catch (err: any) {
      console.warn('Failed to load activity logs:', err.message);
      showToast('error', 'Could not load real-time activity feed.', 'Activity Log');
    } finally {
      setIsLoading(false);
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [agencyId]);

  // Selected User Object for quick preview/filter banner
  const activeUserObj = useMemo(() => {
    if (selectedUserId === 'all') return null;
    return userStats.find(u => u.id === selectedUserId || u.name.toLowerCase() === selectedUserId.toLowerCase());
  }, [selectedUserId, userStats]);

  // Dropdown options for members (Users & Drivers)
  const memberDropdownOptions: CustomDropdownOption[] = useMemo(() => {
    const options: CustomDropdownOption[] = [
      {
        value: 'all',
        label: 'All Members (Users & Drivers)',
        sublabel: `Showing full organization activity (${userStats.length} members)`,
        badge: `${activities.length} logs`,
        icon: <Users size={14} color="var(--accent)" />
      }
    ];

    // Staff / Users
    const systemUsers = userStats.filter(u => u.actorType === 'user');
    systemUsers.forEach(u => {
      options.push({
        value: u.id,
        label: `${u.name} (Admin / Staff)`,
        sublabel: u.email || `${u.role} · ${u.agencyName || 'Organization'}`,
        badge: `${u.totalActivities} activities`,
        badgeColor: 'rgba(56, 189, 248, 0.2)',
        icon: <Shield size={14} color="#38bdf8" />
      });
    });

    // Drivers
    const driverMembers = userStats.filter(u => u.actorType === 'driver');
    driverMembers.forEach(d => {
      options.push({
        value: d.id,
        label: `${d.name} (Driver)`,
        sublabel: d.assignedVehicle ? `Vehicle: ${d.assignedVehicle}` : `${d.status} · Pool Driver`,
        badge: `${d.totalActivities} activities`,
        badgeColor: 'rgba(34, 197, 94, 0.2)',
        icon: <Car size={14} color="#16a34a" />
      });
    });

    return options;
  }, [userStats, activities.length]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      // User filter
      if (selectedUserId !== 'all') {
        const matchesId = String(act.actorId) === String(selectedUserId);
        const matchesName = act.actorName.toLowerCase() === selectedUserId.toLowerCase();
        if (!matchesId && !matchesName) return false;
      }

      // Actor type filter
      if (selectedActorType !== 'all' && act.actorType !== selectedActorType) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'duty' && act.category !== 'duty' && act.category !== 'trips') return false;
        if (selectedCategory !== 'duty' && act.category !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inActor = act.actorName?.toLowerCase().includes(q);
        const inAction = act.action?.toLowerCase().includes(q);
        const inDesc = act.description?.toLowerCase().includes(q);
        const inCat = act.category?.toLowerCase().includes(q);
        const inPlate = act.meta?.vehicleRegistration?.toLowerCase().includes(q) || act.meta?.vehicle?.toLowerCase().includes(q);
        if (!inActor && !inAction && !inDesc && !inCat && !inPlate) return false;
      }

      return true;
    });
  }, [activities, selectedUserId, selectedActorType, selectedCategory, searchQuery]);

  // Calculated high level KPIs
  const statsSummary = useMemo(() => {
    const total = activities.length;
    const activeToday = userStats.filter(u => u.todayActivitiesCount > 0).length;
    const sortedByActivity = [...userStats].sort((a, b) => b.totalActivities - a.totalActivities);
    const mostActive = sortedByActivity[0];

    const lastAct = activities[0];
    return {
      total,
      activeToday,
      mostActiveName: mostActive ? `${mostActive.name} (${mostActive.totalActivities})` : '—',
      lastActivityTime: lastAct?.createdAt ? new Date(lastAct.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None'
    };
  }, [activities, userStats]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredActivities.length === 0) {
      showToast('info', 'No activities to export with current filters.', 'Export');
      return;
    }

    const headers = ['Timestamp', 'Actor Name', 'Actor Type', 'Role', 'Action', 'Category', 'Description', 'Vehicle Plate'];
    const rows = filteredActivities.map(a => [
      new Date(a.createdAt).toISOString(),
      `"${a.actorName}"`,
      a.actorType,
      a.actorRole,
      `"${a.action}"`,
      a.category,
      `"${a.description.replace(/"/g, '""')}"`,
      a.meta?.vehicleRegistration || a.meta?.vehicle || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kabpro_activity_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Activity audit log exported to CSV.', 'Export Complete');
  };

  // Helper for category badge color and icon
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'vehicles':
        return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)', icon: <Car size={14} /> };
      case 'trips':
      case 'duty':
        return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', icon: <Navigation size={14} /> };
      case 'attendance':
        return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', icon: <CalendarCheck size={14} /> };
      case 'expenses':
      case 'payroll':
        return { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)', icon: <Receipt size={14} /> };
      case 'auth':
        return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', icon: <ShieldCheck size={14} /> };
      default:
        return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.3)', icon: <Activity size={14} /> };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(22, 135, 245, 0.2) 0%, rgba(56, 189, 248, 0.1) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)'
              }}
            >
              <Activity size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                Activity & Audit Trail
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-faint)' }}>
                Real-time tracking of all users, drivers, assignments, and operations in {currentAgency?.name || 'Organization'}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchData}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12.5px'
            }}
          >
            <RefreshCw size={13} style={{ animation: isLoading ? 'spin-loader 0.8s linear infinite' : undefined }} />
            <span>Refresh Feed</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12.5px'
            }}
          >
            <Download size={13} />
            <span>Export Log</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="stats-grid">
        <StatCard
          label="Total Activity Records"
          value={statsSummary.total}
          delta="Full audit event log"
          isUp
          icon={<Activity size={16} />}
        />
        <StatCard
          label="Active Members Today"
          value={statsSummary.activeToday}
          delta={`${userStats.length} total members in organization`}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Most Active Member"
          value={statsSummary.mostActiveName}
          delta="Top event contributor"
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Latest Event Logged"
          value={statsSummary.lastActivityTime}
          delta="Live telemetry sync"
          icon={<Clock size={16} />}
        />
      </div>

      {/* Member Telemetry & Last Activity Section */}
      <div className="panel">
        <div
          className="panel-head"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setShowTelemetryDrawer(prev => !prev)}
        >
          <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--accent)" />
            Member Status & Last Activity Telemetry
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'var(--surface-2)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)'
              }}
            >
              {userStats.length} members
            </span>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>
              {showTelemetryDrawer ? 'Collapse View' : 'Expand View'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {showTelemetryDrawer ? '▾' : '▸'}
            </span>
          </div>
        </div>

        {showTelemetryDrawer && (
          <div style={{ marginTop: '14px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
                maxHeight: '380px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}
            >
              {userStats.map(member => {
                const isSelected = selectedUserId === member.id || selectedUserId.toLowerCase() === member.name.toLowerCase();
                const isDriver = member.actorType === 'driver';

                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedUserId(isSelected ? 'all' : member.id)}
                    style={{
                      background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'var(--surface-2)',
                      border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.4)' : 'var(--border)'}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative'
                    }}
                  >
                    {/* Top User Info */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: isDriver
                              ? 'linear-gradient(135deg, #16a34a, #059669)'
                              : 'linear-gradient(135deg, var(--accent), #2563eb)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {member.name}
                            {isSelected && (
                              <span style={{ fontSize: '10px', background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                                Filtered
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                            {isDriver ? (member.assignedVehicle ? `Vehicle: ${member.assignedVehicle}` : 'Pool Driver') : member.role.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Status pill */}
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background:
                            member.status === 'Active' || member.status === 'On duty'
                              ? 'rgba(34, 197, 94, 0.14)'
                              : 'rgba(148, 163, 184, 0.14)',
                          color:
                            member.status === 'Active' || member.status === 'On duty'
                              ? '#16a34a'
                              : 'var(--text-faint)',
                          border: `1px solid ${
                            member.status === 'Active' || member.status === 'On duty'
                              ? 'rgba(34, 197, 94, 0.3)'
                              : 'var(--border)'
                          }`
                        }}
                      >
                        {member.status}
                      </span>
                    </div>

                    {/* Last Activity telemetry block */}
                    <div
                      style={{
                        background: 'var(--surface-3)',
                        borderRadius: '7px',
                        padding: '8px 10px',
                        fontSize: '11.5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '11.5px' }}>
                          {member.lastActivity?.action || 'No recorded events'}
                        </span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                          {member.lastActivity?.timeAgo || '—'}
                        </span>
                      </div>
                      <div
                        style={{
                          color: 'var(--text-faint)',
                          fontSize: '11px',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={member.lastActivity?.description}
                      >
                        {member.lastActivity?.description || 'Awaiting initial activity'}
                      </div>
                    </div>

                    {/* Bottom stats row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-faint)', paddingTop: '2px' }}>
                      <span>Total: <b>{member.totalActivities}</b> actions</span>
                      <span>Today: <b style={{ color: member.todayActivitiesCount > 0 ? '#16a34a' : 'inherit' }}>{member.todayActivitiesCount}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Activity Controls & Feed */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--accent)" /> Real-Time Activity Feed
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)'
              }}
            >
              {filteredActivities.length} events
            </span>
          </span>

          {/* Active User Filter Badge */}
          {activeUserObj && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                color: '#38bdf8'
              }}
            >
              <span>Filtered by: <b>{activeUserObj.name}</b></span>
              <button
                type="button"
                onClick={() => setSelectedUserId('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear user filter"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '14px 0',
            borderBottom: '1px solid var(--border)'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-faint)'
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, action, vehicle, route..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', height: '38px', borderRadius: '8px', fontSize: '12.5px' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-faint)',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* User / Driver Dropdown */}
          <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
            <CustomDropdown
              value={selectedUserId}
              onChange={val => setSelectedUserId(val)}
              options={memberDropdownOptions}
              searchable={true}
              placeholder="Filter by user or driver..."
              buttonStyle={{ height: '38px', borderRadius: '8px', fontSize: '12px' }}
            />
          </div>

          {/* Member Type Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'user', label: 'Staff / Admin' },
              { id: 'driver', label: 'Drivers' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedActorType(tab.id)}
                style={{
                  background: selectedActorType === tab.id ? 'var(--surface)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11.5px',
                  fontWeight: selectedActorType === tab.id ? 700 : 500,
                  color: selectedActorType === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: selectedActorType === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'vehicles', label: 'Vehicles' },
              { id: 'duty', label: 'Trips & Duty' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'expenses', label: 'Expenses' },
              { id: 'auth', label: 'Logins' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? 'var(--surface-3)' : 'transparent',
                  border: `1px solid ${selectedCategory === cat.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  color: selectedCategory === cat.id ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline List */}
        <div style={{ marginTop: '16px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: '13px' }}>
              <RefreshCw size={20} style={{ animation: 'spin-loader 0.8s linear infinite', marginBottom: '8px' }} />
              <div>Loading real-time activity stream...</div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                border: '1px dashed var(--border)',
                borderRadius: '10px',
                color: 'var(--text-faint)'
              }}
            >
              <Activity size={28} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                No Activities Found
              </div>
              <p style={{ fontSize: '12px', marginTop: '4px', maxWidth: '360px', margin: '4px auto 14px' }}>
                No audit events matched your search or filters. Try clearing your filters or refreshing the feed.
              </p>
              {(searchQuery || selectedUserId !== 'all' || selectedCategory !== 'all' || selectedActorType !== 'all') && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedUserId('all');
                    setSelectedCategory('all');
                    setSelectedActorType('all');
                  }}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredActivities.map(item => {
                const theme = getCategoryTheme(item.category);
                const isDriver = item.actorType === 'driver';
                const createdDate = new Date(item.createdAt);
                const timeString = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateString = createdDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                return (
                  <div
                    key={item.id || item._id}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    {/* Category Icon Badge */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '9px',
                        background: theme.bg,
                        border: `1px solid ${theme.border}`,
                        color: theme.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                      title={`Category: ${item.category}`}
                    >
                      {theme.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Top row: Actor info & timestamp */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '13.5px',
                              color: 'var(--text)',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedUserId(item.actorId || item.actorName)}
                            title="Click to filter by this member"
                          >
                            {item.actorName}
                          </span>

                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1.5px 7px',
                              borderRadius: '10px',
                              background: isDriver ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              color: isDriver ? '#16a34a' : '#38bdf8',
                              border: `1px solid ${isDriver ? 'rgba(34, 197, 94, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                            }}
                          >
                            {isDriver ? 'DRIVER' : item.actorRole.toUpperCase()}
                          </span>

                          {item.agencyName && (
                            <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                              · {item.agencyName}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-faint)' }}>
                          <Clock size={12} />
                          <span>{dateString} at {timeString}</span>
                        </div>
                      </div>

                      {/* Action Title */}
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                          {item.action}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '1px 7px',
                            borderRadius: '6px',
                            background: theme.bg,
                            color: theme.color
                          }}
                        >
                          {item.category.toUpperCase()}
                        </span>
                      </div>

                      {/* Description */}
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                        {item.description}
                      </div>

                      {/* Meta Pills (if available) */}
                      {item.meta && Object.keys(item.meta).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {(item.meta.vehicleRegistration || item.meta.vehicle) && (
                            <span
                              style={{
                                fontSize: '11px',
                                background: 'var(--surface-3)',
                                border: '1px solid var(--border)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: 'var(--text)'
                              }}
                            >
                              <Car size={11} color="#38bdf8" />
                              {item.meta.vehicleRegistration || item.meta.vehicle}
                            </span>
                          )}

                          {item.meta.amount != null && (
                            <span
                              style={{
                                fontSize: '11px',
                                background: 'rgba(34, 197, 94, 0.08)',
                                border: '1px solid rgba(34, 197, 94, 0.25)',
                                color: '#16a34a',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700
                              }}
                            >
                              ₹{Number(item.meta.amount).toLocaleString('en-IN')}
                            </span>
                          )}

                          {item.meta.route && (
                            <span
                              style={{
                                fontSize: '11px',
                                background: 'var(--surface-3)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                color: 'var(--text-faint)'
                              }}
                            >
                              Route: {item.meta.route}
                            </span>
                          )}

                          {item.meta.department && (
                            <span
                              style={{
                                fontSize: '11px',
                                background: 'var(--surface-3)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                color: 'var(--text-faint)'
                              }}
                            >
                              Client: {item.meta.department}
                            </span>
                          )}

                          {item.meta.assignedBy && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-faint)'
                              }}
                            >
                              by {item.meta.assignedBy}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityView;
