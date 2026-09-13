import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { ExportMenu } from '../components/ExportMenu';
import {
  PLAN_CATEGORIES,
  PLAN_MARKETS,
  formatPlanPrice,
  marketFor,
  type PlanCategory,
} from '../constants/plans';
import {
  Card,
  PageHeader,
  StatusPill,
  fieldStyle,
  labelStyle,
  primaryBtn,
  secondaryBtn,
} from '../components/ui';

type Benefit = { title: string; detail?: string };

type Plan = {
  id: string;
  name: string;
  code: string;
  category?: PlanCategory | string;
  description?: string;
  benefits?: Benefit[];
  features?: string[];
  country: string;
  countryName?: string;
  currency: string;
  priceMonthly: number;
  priceYearly: number;
  pricingLabel?: string;
  trialDays: number;
  limits?: { vehicles?: number; drivers?: number; users?: number };
  featured?: boolean;
  isActive: boolean;
  sortOrder?: number;
};

type Sub = {
  id: string;
  status: string;
  billingCycle?: string;
  trialEndsAt?: string;
  organization?: { id?: string; name?: string; status?: string } | null;
  plan?: { name?: string; code?: string; trialDays?: number; country?: string } | null;
};

type Org = { id: string; name: string };

type PlanForm = {
  id?: string;
  name: string;
  code: string;
  category: string;
  description: string;
  country: string;
  countryName: string;
  currency: string;
  priceMonthly: string;
  priceYearly: string;
  pricingLabel: string;
  trialDays: string;
  vehicles: string;
  drivers: string;
  users: string;
  featured: boolean;
  isActive: boolean;
  sortOrder: string;
  benefits: Benefit[];
};

const emptyForm = (): PlanForm => {
  const m = PLAN_MARKETS[0];
  return {
    name: '',
    code: '',
    category: 'Starter',
    description: '',
    country: m.country,
    countryName: m.countryName,
    currency: m.currency,
    priceMonthly: '0',
    priceYearly: '0',
    pricingLabel: '',
    trialDays: '14',
    vehicles: '25',
    drivers: '50',
    users: '5',
    featured: false,
    isActive: true,
    sortOrder: '0',
    benefits: [{ title: '', detail: '' }],
  };
};

function planToForm(p: Plan): PlanForm {
  const benefits =
    p.benefits?.length
      ? p.benefits.map((b) => ({ title: b.title || '', detail: b.detail || '' }))
      : (p.features || []).map((title) => ({ title, detail: '' }));
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    category: p.category || 'Starter',
    description: p.description || '',
    country: p.country || 'IN',
    countryName: p.countryName || marketFor(p.country).countryName,
    currency: p.currency || 'INR',
    priceMonthly: String(p.priceMonthly ?? 0),
    priceYearly: String(p.priceYearly ?? 0),
    pricingLabel: p.pricingLabel || '',
    trialDays: String(p.trialDays ?? 14),
    vehicles: String(p.limits?.vehicles ?? 25),
    drivers: String(p.limits?.drivers ?? 50),
    users: String(p.limits?.users ?? 5),
    featured: !!p.featured,
    isActive: p.isActive !== false,
    sortOrder: String(p.sortOrder ?? 0),
    benefits: benefits.length ? benefits : [{ title: '', detail: '' }],
  };
}

export const SubscriptionsPage: React.FC = () => {
  const { token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const [assign, setAssign] = useState({ organizationId: '', planId: '', startTrial: true });

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (countryFilter !== 'All' && p.country !== countryFilter) return false;
      if (categoryFilter !== 'All' && (p.category || 'Starter') !== categoryFilter) return false;
      return true;
    });
  }, [plans, countryFilter, categoryFilter]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [p, s, o] = await Promise.all([
        apiFetch<{ plans: Plan[] }>('/plans', { token }),
        apiFetch<{ subscriptions: Sub[] }>('/subscriptions', { token }),
        apiFetch<{ organizations: Org[] }>('/organizations', { token }),
      ]);
      setPlans(p.plans || []);
      setSubs(s.subscriptions || []);
      setOrgs(o.organizations || []);
      setAssign((a) => ({
        ...a,
        organizationId: a.organizationId || o.organizations?.[0]?.id || '',
        planId: a.planId || p.plans?.[0]?.id || '',
      }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreate = () => {
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setForm(planToForm(plan));
    setFormOpen(true);
  };

  const onCountryChange = (code: string) => {
    const m = marketFor(code);
    setForm((f) => ({
      ...f,
      country: m.country,
      countryName: m.countryName,
      currency: m.currency,
    }));
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const benefits = form.benefits
        .map((b) => ({ title: b.title.trim(), detail: (b.detail || '').trim() }))
        .filter((b) => b.title);
      const body = {
        id: form.id,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        category: form.category,
        description: form.description.trim(),
        country: form.country,
        countryName: form.countryName,
        currency: form.currency,
        priceMonthly: Number(form.priceMonthly || 0),
        priceYearly: Number(form.priceYearly || 0),
        pricingLabel: form.pricingLabel.trim(),
        trialDays: Number(form.trialDays || 14),
        featured: form.featured,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder || 0),
        benefits,
        limits: {
          vehicles: Number(form.vehicles || 0),
          drivers: Number(form.drivers || 0),
          users: Number(form.users || 0),
        },
      };
      await apiFetch('/plans', { method: 'POST', token, body: JSON.stringify(body) });
      setFormOpen(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (plan: Plan) => {
    if (!window.confirm(`Delete plan “${plan.name}” (${plan.country})?`)) return;
    try {
      await apiFetch(`/plans/${plan.id}`, { method: 'DELETE', token });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const seed = async () => {
    try {
      await apiFetch('/plans/seed-defaults', { method: 'POST', token });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Seed failed');
    }
  };

  const assignSub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/subscriptions', {
        method: 'POST',
        token,
        body: JSON.stringify(assign),
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Assign failed');
    }
  };

  const patchSub = async (id: string, status: string) => {
    try {
      await apiFetch(`/subscriptions/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Plans & subscriptions"
        subtitle="Fully manage country-based plans (name, description, benefits, pricing). Assignments stay Superadmin-only for now."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <ExportMenu defaultKind="plans" label="Export" />
            <button type="button" style={secondaryBtn} onClick={seed}>
              Seed markets
            </button>
            <button type="button" style={primaryBtn} onClick={openCreate}>
              <Plus size={15} /> New plan
            </button>
          </div>
        }
      />

      {error && (
        <p style={{ color: 'var(--danger)', marginTop: 0 }}>{error}</p>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-dim)' }}>
          <Loader2 size={14} className="spin" /> Loading…
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 10,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Country</span>
            <button
              type="button"
              style={{
                ...(countryFilter === 'All' ? primaryBtn : secondaryBtn),
                height: 32,
                fontSize: 12,
              }}
              onClick={() => setCountryFilter('All')}
            >
              All
            </button>
            {PLAN_MARKETS.map((m) => (
              <button
                key={m.country}
                type="button"
                style={{
                  ...(countryFilter === m.country ? primaryBtn : secondaryBtn),
                  height: 32,
                  fontSize: 12,
                }}
                onClick={() => setCountryFilter(m.country)}
              >
                {m.country}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 14,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Category</span>
            <button
              type="button"
              style={{
                ...(categoryFilter === 'All' ? primaryBtn : secondaryBtn),
                height: 32,
                fontSize: 12,
              }}
              onClick={() => setCategoryFilter('All')}
            >
              All
            </button>
            {PLAN_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                style={{
                  ...(categoryFilter === c ? primaryBtn : secondaryBtn),
                  height: 32,
                  fontSize: 12,
                }}
                onClick={() => setCategoryFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            {filteredPlans.map((p) => {
              const benefits = p.benefits?.length
                ? p.benefits
                : (p.features || []).map((t) => ({ title: t }));
              return (
                <Card key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>
                        {p.code} · {p.country} · {p.category || '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {p.featured && <StatusPill label="Featured" tone="blue" />}
                      <StatusPill
                        label={p.isActive ? 'Active' : 'Off'}
                        tone={p.isActive ? 'green' : 'gray'}
                      />
                    </div>
                  </div>
                  {p.description && (
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.45 }}>
                      {p.description}
                    </p>
                  )}
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {formatPlanPrice(p.priceMonthly, p.currency, p.pricingLabel)}
                    {!p.pricingLabel && p.priceMonthly > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-faint)' }}>
                        /mo
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    Yearly {formatPlanPrice(p.priceYearly, p.currency, p.pricingLabel === 'Custom' ? 'Custom' : '')}
                    {' · '}Trial {p.trialDays}d
                    {' · '}
                    {p.limits?.vehicles ?? '—'} veh / {p.limits?.users ?? '—'} users
                  </div>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12.5, color: 'var(--text)' }}>
                    {benefits.slice(0, 5).map((b, i) => (
                      <li key={`${p.id}-b-${i}`} style={{ marginBottom: 3 }}>
                        {b.title}
                      </li>
                    ))}
                    {!benefits.length && (
                      <li style={{ color: 'var(--text-faint)', listStyle: 'none', marginLeft: -16 }}>
                        No benefits listed
                      </li>
                    )}
                  </ul>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                    <button
                      type="button"
                      style={{ ...secondaryBtn, height: 32, fontSize: 12, flex: 1 }}
                      onClick={() => openEdit(p)}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      style={{ ...secondaryBtn, height: 32, fontSize: 12 }}
                      onClick={() => deletePlan(p)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Card>
              );
            })}
            {!filteredPlans.length && (
              <Card>
                <p style={{ margin: 0, color: 'var(--text-faint)', fontSize: 13 }}>
                  No plans for this filter — create one or seed market defaults.
                </p>
              </Card>
            )}
          </div>

          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Assign plan / start trial</h3>
            <form
              onSubmit={assignSub}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto auto',
                gap: 10,
                alignItems: 'end',
              }}
            >
              <div>
                <label style={labelStyle}>Organization</label>
                <select
                  style={fieldStyle}
                  value={assign.organizationId}
                  onChange={(e) => setAssign({ ...assign, organizationId: e.target.value })}
                  required
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Plan (country pricing)</label>
                <select
                  style={fieldStyle}
                  value={assign.planId}
                  onChange={(e) => setAssign({ ...assign, planId: e.target.value })}
                  required
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.country} · {formatPlanPrice(p.priceMonthly, p.currency, p.pricingLabel)}
                    </option>
                  ))}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, height: 42 }}>
                <input
                  type="checkbox"
                  checked={assign.startTrial}
                  onChange={(e) => setAssign({ ...assign, startTrial: e.target.checked })}
                />
                Start trial
              </label>
              <button type="submit" style={primaryBtn}>
                Assign
              </button>
            </form>
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-faint)', fontSize: 12 }}>
                  <th style={th}>Organization</th>
                  <th style={th}>Plan</th>
                  <th style={th}>Status</th>
                  <th style={th}>Trial ends</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={td}>{s.organization?.name || '—'}</td>
                    <td style={td}>{s.plan?.name || s.plan?.code || '—'}</td>
                    <td style={td}>
                      <StatusPill
                        label={s.status}
                        tone={
                          s.status === 'Active'
                            ? 'green'
                            : s.status === 'Trial'
                              ? 'blue'
                              : s.status === 'Expired' || s.status === 'Cancelled'
                                ? 'red'
                                : 'amber'
                        }
                      />
                    </td>
                    <td style={td}>
                      {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {s.status === 'Trial' && (
                          <button
                            type="button"
                            style={{ ...secondaryBtn, height: 32, fontSize: 12 }}
                            onClick={() => patchSub(s.id, 'Active')}
                          >
                            Activate
                          </button>
                        )}
                        {['Trial', 'Active'].includes(s.status) && (
                          <button
                            type="button"
                            style={{ ...secondaryBtn, height: 32, fontSize: 12 }}
                            onClick={() => patchSub(s.id, 'Expired')}
                          >
                            End
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!subs.length && (
                  <tr>
                    <td colSpan={5} style={{ ...td, color: 'var(--text-faint)' }}>
                      No subscriptions yet — onboard an org or assign a plan above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {formOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '40px 16px',
            overflowY: 'auto',
          }}
          onClick={() => !saving && setFormOpen(false)}
        >
          <Card
            style={{ width: '100%', maxWidth: 640, position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-dim)',
              }}
            >
              <X size={18} />
            </button>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>
              {form.id ? 'Edit plan' : 'Create plan'}
            </h3>
            <form onSubmit={savePlan} style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input
                    style={fieldStyle}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Code</label>
                  <input
                    style={fieldStyle}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="STARTER"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    style={fieldStyle}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {PLAN_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <select
                    style={fieldStyle}
                    value={form.country}
                    onChange={(e) => onCountryChange(e.target.value)}
                  >
                    {PLAN_MARKETS.map((m) => (
                      <option key={m.country} value={m.country}>
                        {m.countryName} ({m.country})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <input style={fieldStyle} value={form.currency} readOnly />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...fieldStyle, minHeight: 72, resize: 'vertical' }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short plan summary for operators"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Monthly price</label>
                  <input
                    style={fieldStyle}
                    type="number"
                    min={0}
                    value={form.priceMonthly}
                    onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Yearly price</label>
                  <input
                    style={fieldStyle}
                    type="number"
                    min={0}
                    value={form.priceYearly}
                    onChange={(e) => setForm({ ...form, priceYearly: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Pricing label (optional)</label>
                  <input
                    style={fieldStyle}
                    value={form.pricingLabel}
                    onChange={(e) => setForm({ ...form, pricingLabel: e.target.value })}
                    placeholder="Free / Custom"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Trial days</label>
                  <input
                    style={fieldStyle}
                    type="number"
                    min={0}
                    value={form.trialDays}
                    onChange={(e) => setForm({ ...form, trialDays: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Vehicles</label>
                  <input
                    style={fieldStyle}
                    type="number"
                    min={0}
                    value={form.vehicles}
                    onChange={(e) => setForm({ ...form, vehicles: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Drivers</label>
                  <input
                    style={fieldStyle}
                    type="number"
                    min={0}
                    value={form.drivers}
                    onChange={(e) => setForm({ ...form, drivers: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Users</label>
                  <input
                    style={fieldStyle}
                    type="number"
                    min={0}
                    value={form.users}
                    onChange={(e) => setForm({ ...form, users: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Benefits</label>
                  <button
                    type="button"
                    style={{ ...secondaryBtn, height: 28, fontSize: 12 }}
                    onClick={() =>
                      setForm({
                        ...form,
                        benefits: [...form.benefits, { title: '', detail: '' }],
                      })
                    }
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {form.benefits.map((b, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                      <input
                        style={fieldStyle}
                        placeholder="Benefit title"
                        value={b.title}
                        onChange={(e) => {
                          const next = [...form.benefits];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setForm({ ...form, benefits: next });
                        }}
                      />
                      <input
                        style={fieldStyle}
                        placeholder="Detail (optional)"
                        value={b.detail || ''}
                        onChange={(e) => {
                          const next = [...form.benefits];
                          next[idx] = { ...next[idx], detail: e.target.value };
                          setForm({ ...form, benefits: next });
                        }}
                      />
                      <button
                        type="button"
                        style={{ ...secondaryBtn, height: 42, width: 42, padding: 0 }}
                        onClick={() =>
                          setForm({
                            ...form,
                            benefits: form.benefits.filter((_, i) => i !== idx),
                          })
                        }
                        disabled={form.benefits.length <= 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active
                </label>
                <div style={{ width: 100 }}>
                  <label style={labelStyle}>Sort</label>
                  <input
                    style={fieldStyle}
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  style={secondaryBtn}
                  disabled={saving}
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={primaryBtn} disabled={saving}>
                  {saving ? <Loader2 size={14} className="spin" /> : null}
                  {form.id ? 'Save changes' : 'Create plan'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

const th: React.CSSProperties = { padding: '12px 14px', fontWeight: 500 };
const td: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' };
