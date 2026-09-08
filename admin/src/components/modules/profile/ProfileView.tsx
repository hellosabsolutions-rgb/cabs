import React, { useState, useEffect } from 'react';
import { useAuth, DeviceSession } from '../../../context/AuthContext';
import { useAgency } from '../../../context/AgencyContext';
import { useTheme } from '../../../context/ThemeContext';
import { api } from '../../../services/api';
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  Save,
  LogOut,
  Pencil,
  X,
  Globe,
  MapPin,
  FileText,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

type ProfileSection = 'account' | 'security' | 'agency' | 'preferences';

export const ProfileView: React.FC = () => {
  const {
    user,
    logout,
    sessions,
    isLoadingSessions,
    fetchSessions,
    revokeSession,
    revokeAllOtherSessions
  } = useAuth();
  const { currentAgency, updateAgency } = useAgency();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<ProfileSection>('account');
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingAgency, setEditingAgency] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [savedAccount, setSavedAccount] = useState(false);
  const [savedAgency, setSavedAgency] = useState(false);
  const [savedPwd, setSavedPwd] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  // Multi-device session state
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [sessionToast, setSessionToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  // Account form state
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Agency form state
  const [agencyForm, setAgencyForm] = useState({
    name: currentAgency?.name || '',
    phone: currentAgency?.phone || '',
    email: currentAgency?.email || '',
    address: currentAgency?.address || '',
    city: currentAgency?.city || '',
    state: currentAgency?.state || '',
    gstin: currentAgency?.gstin || '',
    pan: currentAgency?.pan || '',
    businessType: currentAgency?.businessType || '',
  });

  // Password form
  const [pwdForm, setPwdForm] = useState({ old: '', newPwd: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');

  // Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    compliance: true,
    maintenance: true,
    fleet: true,
    financial: true,
    bookings: true,
  });

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AD';

  // Fetch notification preferences on mount
  useEffect(() => {
    api.get('/profile/notification-preferences')
      .then(res => {
        if (res.success && res.preferences) {
          setNotifPrefs(res.preferences);
        }
      })
      .catch(() => {}); // use defaults on error
  }, []);

  // Fetch active sessions whenever Security tab is activated
  useEffect(() => {
    if (activeSection === 'security') {
      fetchSessions();
    }
  }, [activeSection, fetchSessions]);

  const handleRevokeSingle = async (session: DeviceSession) => {
    if (session.isCurrent) {
      if (window.confirm('Log out from this device? You will need to sign in again.')) {
        await logout();
      }
      return;
    }

    setRevokingId(session.id);
    const ok = await revokeSession(session.id);
    setRevokingId(null);
    if (ok) {
      setSessionToast({
        type: 'success',
        text: `Device session (${session.deviceLabel}) has been logged out.`
      });
      setTimeout(() => setSessionToast(null), 3500);
    } else {
      setSessionToast({
        type: 'error',
        text: 'Failed to log out device session. Please try again.'
      });
      setTimeout(() => setSessionToast(null), 3500);
    }
  };

  const handleRevokeAllOther = async () => {
    if (window.confirm('Are you sure you want to log out from all other devices? All other active sessions will be invalidated immediately.')) {
      setIsRevokingAll(true);
      const ok = await revokeAllOtherSessions();
      setIsRevokingAll(false);
      if (ok) {
        setSessionToast({
          type: 'success',
          text: 'All other active devices have been logged out successfully.'
        });
        setTimeout(() => setSessionToast(null), 3500);
      } else {
        setSessionToast({
          type: 'error',
          text: 'Failed to revoke other sessions. Please try again.'
        });
        setTimeout(() => setSessionToast(null), 3500);
      }
    }
  };


  const handleSaveAccount = async () => {
    setAccountError('');
    setIsSavingAccount(true);
    try {
      const res = await api.put('/profile', {
        name: accountForm.name,
        phone: accountForm.phone
      });
      if (res.success) {
        setSavedAccount(true);
        setEditingAccount(false);
        setTimeout(() => setSavedAccount(false), 3000);
      } else {
        setAccountError(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setAccountError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSaveAgency = async () => {
    if (!currentAgency) return;
    const id = currentAgency.id || currentAgency._id || '';
    const result = await updateAgency(id, agencyForm);
    if (result.success) {
      setSavedAgency(true);
      setEditingAgency(false);
      setTimeout(() => setSavedAgency(false), 3000);
    }
  };

  const handleChangePwd = async () => {
    if (!pwdForm.old) { setPwdError('Please enter your current password.'); return; }
    if (pwdForm.newPwd.length < 6) { setPwdError('New password must be at least 6 characters.'); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdError('Passwords do not match.'); return; }
    setPwdError('');
    setIsSavingPwd(true);
    try {
      const res = await api.put('/profile/password', {
        currentPassword: pwdForm.old,
        newPassword: pwdForm.newPwd
      });
      if (res.success) {
        setSavedPwd(true);
        setPwdForm({ old: '', newPwd: '', confirm: '' });
        setTimeout(() => setSavedPwd(false), 3000);
      } else {
        setPwdError(res.error || 'Failed to change password.');
      }
    } catch (err: any) {
      setPwdError(err.message || 'Failed to change password.');
    } finally {
      setIsSavingPwd(false);
    }
  };

  const sections: { id: ProfileSection; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'account', label: 'Account', icon: <User size={15} />, desc: 'Personal info & avatar' },
    { id: 'security', label: 'Security', icon: <Lock size={15} />, desc: 'Password & authentication' },
    { id: 'agency', label: 'Agency', icon: <Building2 size={15} />, desc: 'Business details & GST' },
    { id: 'preferences', label: 'Preferences', icon: <Bell size={15} />, desc: 'Theme & notifications' },
  ];

  const roleColors: Record<string, string> = {
    admin: 'var(--accent)',
    manager: 'var(--success)',
    operator: 'var(--warning)',
  };
  const roleColor = roleColors[user?.role || 'admin'] || 'var(--accent)';

  return (
    <div className="section active profile-page">
      {/* Header */}
      <div className="profile-page-header">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-lg">
            {initials}
          </div>
          <button className="profile-avatar-edit" title="Change photo">
            <Camera size={13} />
          </button>
        </div>
        <div className="profile-header-info">
          <h2 className="profile-name">{user?.name || 'Administrator'}</h2>
          <p className="profile-email">{user?.email || 'admin@kabpro.com'}</p>
          <div className="profile-badges">
            <span
              className="profile-role-badge"
              style={{ background: `${roleColor}22`, color: roleColor, borderColor: `${roleColor}44` }}
            >
              <Shield size={11} />
              {(user?.role || 'admin').toUpperCase()}
            </span>
            {currentAgency && (
              <span className="profile-agency-badge">
                <Building2 size={11} />
                {currentAgency.name}
              </span>
            )}
          </div>
        </div>
        <button className="profile-logout-btn" onClick={logout}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      <div className="profile-body">
        {/* Sidebar Nav */}
        <nav className="profile-nav">
          {sections.map(s => (
            <button
              key={s.id}
              className={`profile-nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <div className="profile-nav-icon">{s.icon}</div>
              <div className="profile-nav-text">
                <div className="profile-nav-label">{s.label}</div>
                <div className="profile-nav-desc">{s.desc}</div>
              </div>
              <ChevronRight size={14} className="profile-nav-arrow" />
            </button>
          ))}
        </nav>

        {/* Section Content */}
        <div className="profile-content">

          {/* ── ACCOUNT ── */}
          {activeSection === 'account' && (
            <div className="profile-section-wrap">
              <div className="profile-section-head">
                <div>
                  <div className="profile-section-title">Account Information</div>
                  <div className="profile-section-sub">Manage your personal details and contact info</div>
                </div>
                {!editingAccount ? (
                  <button className="profile-edit-btn" onClick={() => setEditingAccount(true)}>
                    <Pencil size={13} /> Edit
                  </button>
                ) : (
                  <button className="profile-cancel-btn" onClick={() => setEditingAccount(false)}>
                    <X size={13} /> Cancel
                  </button>
                )}
              </div>

              {savedAccount && (
                <div className="profile-save-toast">
                  <Check size={14} /> Profile updated successfully
                </div>
              )}

              {accountError && (
                <div className="profile-error">{accountError}</div>
              )}

              <div className="profile-fields">
                <div className="profile-field-group">
                  <div className="profile-field-label">
                    <User size={13} /> Full Name
                  </div>
                  {editingAccount ? (
                    <input
                      className="profile-input"
                      value={accountForm.name}
                      onChange={e => setAccountForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Your full name"
                    />
                  ) : (
                    <div className="profile-field-value">{accountForm.name || '—'}</div>
                  )}
                </div>

                <div className="profile-field-group">
                  <div className="profile-field-label">
                    <Mail size={13} /> Email Address
                  </div>
                  {editingAccount ? (
                    <input
                      className="profile-input"
                      type="email"
                      value={accountForm.email}
                      onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                    />
                  ) : (
                    <div className="profile-field-value">{accountForm.email || '—'}</div>
                  )}
                </div>

                <div className="profile-field-group">
                  <div className="profile-field-label">
                    <Phone size={13} /> Phone Number
                  </div>
                  {editingAccount ? (
                    <input
                      className="profile-input"
                      type="tel"
                      value={accountForm.phone}
                      onChange={e => setAccountForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 00000 00000"
                    />
                  ) : (
                    <div className="profile-field-value">{accountForm.phone || '—'}</div>
                  )}
                </div>

                <div className="profile-field-group">
                  <div className="profile-field-label">
                    <Shield size={13} /> Access Role
                  </div>
                  <div className="profile-field-value">
                    <span
                      className="profile-role-badge"
                      style={{ background: `${roleColor}22`, color: roleColor, borderColor: `${roleColor}44` }}
                    >
                      {(user?.role || 'admin').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: '8px' }}>
                      Role cannot be changed here
                    </span>
                  </div>
                </div>
              </div>

              {editingAccount && (
                <div className="profile-actions">
                  <button
                    className="profile-save-btn"
                    onClick={handleSaveAccount}
                    disabled={isSavingAccount}
                    style={{ opacity: isSavingAccount ? 0.7 : 1 }}
                  >
                    <Save size={14} /> {isSavingAccount ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeSection === 'security' && (
            <div className="profile-section-wrap">
              <div className="profile-section-head">
                <div>
                  <div className="profile-section-title">Security Settings</div>
                  <div className="profile-section-sub">Change your password and review access sessions</div>
                </div>
              </div>

              {savedPwd && (
                <div className="profile-save-toast">
                  <Check size={14} /> Password updated successfully
                </div>
              )}

              <div className="profile-security-card">
                <div className="profile-security-icon">
                  <Lock size={22} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Change Password</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '20px' }}>
                  Use a strong password of at least 8 characters with a mix of letters, numbers, and symbols.
                </p>

                <div className="profile-fields" style={{ gap: '14px' }}>
                  {/* Current Password */}
                  <div className="profile-field-group">
                    <div className="profile-field-label">Current Password</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="profile-input"
                        type={showOldPwd ? 'text' : 'password'}
                        value={pwdForm.old}
                        onChange={e => setPwdForm(p => ({ ...p, old: e.target.value }))}
                        placeholder="Enter current password"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        className="pwd-eye"
                        type="button"
                        onClick={() => setShowOldPwd(p => !p)}
                      >
                        {showOldPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="profile-field-group">
                    <div className="profile-field-label">New Password</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="profile-input"
                        type={showNewPwd ? 'text' : 'password'}
                        value={pwdForm.newPwd}
                        onChange={e => setPwdForm(p => ({ ...p, newPwd: e.target.value }))}
                        placeholder="Enter new password"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        className="pwd-eye"
                        type="button"
                        onClick={() => setShowNewPwd(p => !p)}
                      >
                        {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {pwdForm.newPwd && (
                      <div className="pwd-strength">
                        {['Weak', 'Fair', 'Good', 'Strong'].map((s, i) => (
                          <div
                            key={s}
                            className={`pwd-bar ${pwdForm.newPwd.length > i * 3 ? 'active' : ''}`}
                            style={{
                              background: pwdForm.newPwd.length > i * 3
                                ? (i < 1 ? '#f15b4a' : i < 2 ? '#fff36a' : i < 3 ? '#26b8d8' : '#22c55e')
                                : undefined
                            }}
                          />
                        ))}
                        <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                          {pwdForm.newPwd.length < 4 ? 'Weak' : pwdForm.newPwd.length < 7 ? 'Fair' : pwdForm.newPwd.length < 10 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="profile-field-group">
                    <div className="profile-field-label">Confirm New Password</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="profile-input"
                        type={showConfirmPwd ? 'text' : 'password'}
                        value={pwdForm.confirm}
                        onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))}
                        placeholder="Re-enter new password"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        className="pwd-eye"
                        type="button"
                        onClick={() => setShowConfirmPwd(p => !p)}
                      >
                        {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {pwdError && (
                  <div className="profile-error">{pwdError}</div>
                )}

                <button
                  className="profile-save-btn"
                  style={{ marginTop: '20px', opacity: isSavingPwd ? 0.7 : 1 }}
                  onClick={handleChangePwd}
                  disabled={isSavingPwd}
                >
                  <Lock size={14} /> {isSavingPwd ? 'Updating…' : 'Update Password'}
                </button>
              </div>

              {/* Active Sessions */}
              <div className="profile-section-head" style={{ marginTop: '28px' }}>
                <div>
                  <div className="profile-section-title">Active Devices & Sessions</div>
                  <div className="profile-section-sub">
                    Devices and browsers currently authenticated. You can log out of any device remotely.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="profile-edit-btn"
                    onClick={() => fetchSessions()}
                    disabled={isLoadingSessions}
                    title="Refresh devices"
                    style={{ padding: '6px 10px' }}
                  >
                    <RotateCw size={13} className={isLoadingSessions ? 'spin-loader' : ''} /> Refresh
                  </button>

                  {sessions.some(s => !s.isCurrent) && (
                    <button
                      type="button"
                      className="profile-cancel-btn"
                      onClick={handleRevokeAllOther}
                      disabled={isRevokingAll}
                      style={{
                        background: 'rgba(241, 91, 74, 0.1)',
                        borderColor: 'rgba(241, 91, 74, 0.3)',
                        color: 'var(--danger)',
                        padding: '6px 12px'
                      }}
                    >
                      {isRevokingAll ? (
                        <>
                          <Loader2 size={13} className="spin-loader" /> Logging out others...
                        </>
                      ) : (
                        <>
                          <LogOut size={13} /> Log Out All Other Devices
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Session status toast */}
              {sessionToast && (
                <div
                  className="profile-save-toast"
                  style={{
                    marginBottom: '14px',
                    background: sessionToast.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(241, 91, 74, 0.12)',
                    borderColor: sessionToast.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(241, 91, 74, 0.3)',
                    color: sessionToast.type === 'success' ? 'var(--success)' : 'var(--danger)'
                  }}
                >
                  {sessionToast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{sessionToast.text}</span>
                </div>
              )}

              {/* Sessions list */}
              <div className="profile-sessions">
                {isLoadingSessions && sessions.length === 0 ? (
                  <div
                    style={{
                      padding: '32px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      color: 'var(--text-faint)',
                      background: 'var(--surface-2)',
                      borderRadius: '12px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <Loader2 size={24} className="spin-loader" />
                    <span style={{ fontSize: '13px' }}>Loading active sessions...</span>
                  </div>
                ) : sessions.length === 0 ? (
                  <div
                    className="profile-session-item current"
                    style={{ display: 'flex', alignItems: 'center', gap: '14px' }}
                  >
                    <div className="profile-session-icon-wrap">
                      <Laptop size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>Current Browser Session</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        Active now · Direct session
                      </div>
                    </div>
                    <span className="profile-session-badge current">Current</span>
                  </div>
                ) : (
                  sessions.map(s => {
                    const isMobile = s.deviceType === 'mobile';
                    const isTablet = s.deviceType === 'tablet';

                    return (
                      <div
                        key={s.id}
                        className={`profile-session-item ${s.isCurrent ? 'current' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                          <div className="profile-session-icon-wrap">
                            {isMobile ? (
                              <Smartphone size={18} />
                            ) : isTablet ? (
                              <Tablet size={18} />
                            ) : (
                              <Laptop size={18} />
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                                {s.deviceLabel || `${s.browser} on ${s.os}`}
                              </span>

                              {s.isCurrent && (
                                <span className="profile-session-badge current">
                                  <span className="profile-session-dot active" style={{ width: '6px', height: '6px' }} />
                                  Current Device
                                </span>
                              )}

                              <span className="profile-session-badge remember">
                                {s.rememberMe ? '30-Day Session' : 'Session Only'}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: '11.5px',
                                color: 'var(--text-faint)',
                                marginTop: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <span>IP: {s.ip}</span>
                              <span>•</span>
                              <span>
                                {s.isCurrent
                                  ? 'Active now'
                                  : s.lastActive
                                  ? `Last active: ${new Date(s.lastActive).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}`
                                  : 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Session Actions */}
                        <div style={{ flexShrink: 0, marginLeft: '12px' }}>
                          {s.isCurrent ? (
                            <button
                              type="button"
                              className="profile-cancel-btn"
                              onClick={() => handleRevokeSingle(s)}
                              title="Sign out of this browser"
                              style={{ fontSize: '11.5px', padding: '5px 10px', height: 'auto' }}
                            >
                              <LogOut size={12} /> Sign Out
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="profile-session-revoke-btn"
                              onClick={() => handleRevokeSingle(s)}
                              disabled={revokingId === s.id}
                              title="Revoke and sign out this device remotely"
                            >
                              {revokingId === s.id ? (
                                <>
                                  <Loader2 size={12} className="spin-loader" /> Logging out...
                                </>
                              ) : (
                                <>
                                  <LogOut size={12} /> Log Out Device
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── AGENCY ── */}
          {activeSection === 'agency' && (
            <div className="profile-section-wrap">
              <div className="profile-section-head">
                <div>
                  <div className="profile-section-title">Agency Details</div>
                  <div className="profile-section-sub">Business info, GST, and contact details for your agency</div>
                </div>
                {!editingAgency ? (
                  <button className="profile-edit-btn" onClick={() => setEditingAgency(true)}>
                    <Pencil size={13} /> Edit
                  </button>
                ) : (
                  <button className="profile-cancel-btn" onClick={() => setEditingAgency(false)}>
                    <X size={13} /> Cancel
                  </button>
                )}
              </div>

              {savedAgency && (
                <div className="profile-save-toast">
                  <Check size={14} /> Agency details updated
                </div>
              )}

              {!currentAgency && (
                <div className="profile-no-agency">
                  <Building2 size={28} />
                  <div>No agency linked yet.</div>
                </div>
              )}

              {currentAgency && (
                <>
                  <div className="profile-fields">
                    {[
                      { label: 'Agency Name', key: 'name', icon: <Building2 size={13} />, placeholder: 'e.g. KabPro Transport Pvt Ltd' },
                      { label: 'Business Type', key: 'businessType', icon: <Globe size={13} />, placeholder: 'e.g. Fleet Operator' },
                      { label: 'Phone', key: 'phone', icon: <Phone size={13} />, placeholder: '+91 00000 00000' },
                      { label: 'Email', key: 'email', icon: <Mail size={13} />, placeholder: 'agency@example.com' },
                      { label: 'Address', key: 'address', icon: <MapPin size={13} />, placeholder: 'Street address' },
                      { label: 'City', key: 'city', icon: <MapPin size={13} />, placeholder: 'City' },
                      { label: 'State', key: 'state', icon: <MapPin size={13} />, placeholder: 'State' },
                      { label: 'GSTIN', key: 'gstin', icon: <FileText size={13} />, placeholder: '22AAAAA0000A1Z5' },
                      { label: 'PAN', key: 'pan', icon: <FileText size={13} />, placeholder: 'AAAPL1234C' },
                    ].map(f => (
                      <div className="profile-field-group" key={f.key}>
                        <div className="profile-field-label">
                          {f.icon} {f.label}
                        </div>
                        {editingAgency ? (
                          <input
                            className="profile-input"
                            value={(agencyForm as any)[f.key]}
                            onChange={e => setAgencyForm(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                          />
                        ) : (
                          <div className="profile-field-value">
                            {(agencyForm as any)[f.key] || '—'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {editingAgency && (
                    <div className="profile-actions">
                      <button className="profile-save-btn" onClick={handleSaveAgency}>
                        <Save size={14} /> Save agency details
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── PREFERENCES ── */}
          {activeSection === 'preferences' && (
            <div className="profile-section-wrap">
              {/* Theme */}
              <div className="profile-section-head">
                <div>
                  <div className="profile-section-title">Appearance</div>
                  <div className="profile-section-sub">Choose your preferred dashboard theme</div>
                </div>
              </div>

              <div className="profile-theme-cards">
                <button
                  className={`profile-theme-card ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <div className="profile-theme-preview dark-preview">
                    <div className="ptc-sidebar" />
                    <div className="ptc-content">
                      <div className="ptc-bar" />
                      <div className="ptc-bar short" />
                    </div>
                  </div>
                  <div className="profile-theme-label">
                    <Moon size={14} /> Dark Mode
                    {theme === 'dark' && <Check size={12} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
                  </div>
                </button>

                <button
                  className={`profile-theme-card ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <div className="profile-theme-preview light-preview">
                    <div className="ptc-sidebar" />
                    <div className="ptc-content">
                      <div className="ptc-bar" />
                      <div className="ptc-bar short" />
                    </div>
                  </div>
                  <div className="profile-theme-label">
                    <Sun size={14} /> Light Mode
                    {theme === 'light' && <Check size={12} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
                  </div>
                </button>
              </div>

              {/* Notification Preferences */}
              <div className="profile-section-head" style={{ marginTop: '28px' }}>
                <div>
                  <div className="profile-section-title">Notification Preferences</div>
                  <div className="profile-section-sub">Choose which alerts you want to receive</div>
                </div>
              </div>

              <div className="profile-notif-prefs">
                {(Object.keys(notifPrefs) as (keyof typeof notifPrefs)[]).map(key => (
                  <label key={key} className="profile-notif-row">
                    <div className="profile-notif-info">
                      <div className="profile-notif-key">
                        {key.charAt(0).toUpperCase() + key.slice(1)} Notifications
                      </div>
                      <div className="profile-notif-desc">
                        {key === 'compliance' && 'Document expiry and renewal alerts'}
                        {key === 'maintenance' && 'Service reminders and workshop updates'}
                        {key === 'fleet' && 'Vehicle status, idle and assignment alerts'}
                        {key === 'financial' && 'FASTag balances, expense summaries'}
                        {key === 'bookings' && 'Trip completions and booking alerts'}
                      </div>
                    </div>
                    <div
                      className={`profile-toggle ${notifPrefs[key] ? 'on' : 'off'}`}
                      onClick={() => {
                        const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
                        setNotifPrefs(updated);
                        // Persist to backend
                        api.put('/profile/notification-preferences', { [key]: !notifPrefs[key] }).catch(() => {});
                      }}
                    >
                      <div className="profile-toggle-thumb" />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
