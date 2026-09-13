import { PlatformLead } from '../models/PlatformLead.js';
import { PlatformEvent } from '../models/PlatformEvent.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { OrganizationSubscription } from '../models/OrganizationSubscription.js';
import { Organization } from '../models/Organization.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { trackPlatformEvent } from '../services/platformTracking.js';
import {
  buildPdfReport,
  buildXlsxReport,
  buildDocReport
} from '../services/reportExport.js';

function sendFile(res, buffer, filename, contentType) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export const listLeads = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (status && status !== 'All') filter.status = status;
  if (search?.trim()) {
    filter.$or = [
      { companyName: new RegExp(search.trim(), 'i') },
      { email: new RegExp(search.trim(), 'i') },
      { contactName: new RegExp(search.trim(), 'i') },
      { phone: new RegExp(search.trim(), 'i') }
    ];
  }
  const leads = await PlatformLead.find(filter)
    .sort('-updatedAt')
    .populate('organization', 'name status')
    .populate('assignedTo', 'name email');
  res.json({ success: true, count: leads.length, leads });
});

export const createLead = asyncHandler(async (req, res) => {
  const { companyName, contactName, email, phone, city, source, notes, interestedPlan } =
    req.body;
  if (!companyName?.trim()) {
    return res.status(400).json({ success: false, error: 'Company name is required.' });
  }
  const lead = await PlatformLead.create({
    companyName: companyName.trim(),
    contactName: contactName?.trim(),
    email: email?.trim()?.toLowerCase(),
    phone: phone?.trim(),
    city: city?.trim(),
    source: source || 'Manual',
    notes: notes?.trim(),
    interestedPlan: interestedPlan?.trim(),
    createdBy: req.user._id,
    assignedTo: req.user._id,
    lastTouchAt: new Date()
  });

  await trackPlatformEvent({
    type: 'lead_created',
    title: 'Lead created',
    message: `${lead.companyName} added as ${lead.status}`,
    actorUser: req.user._id,
    actorEmail: req.user.email,
    lead: lead._id,
    meta: { source: lead.source }
  });

  res.status(201).json({ success: true, lead });
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await PlatformLead.findById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found.' });

  const allowed = [
    'companyName',
    'contactName',
    'email',
    'phone',
    'city',
    'source',
    'status',
    'notes',
    'interestedPlan'
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      lead[key] =
        typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
    }
  }
  lead.lastTouchAt = new Date();
  await lead.save();

  await trackPlatformEvent({
    type: 'lead_updated',
    title: 'Lead updated',
    message: `${lead.companyName} → ${lead.status}`,
    actorUser: req.user._id,
    actorEmail: req.user.email,
    lead: lead._id,
    meta: { status: lead.status }
  });

  res.json({ success: true, lead });
});

export const convertLead = asyncHandler(async (req, res) => {
  const lead = await PlatformLead.findById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, error: 'Lead not found.' });
  if (!req.body.organizationId) {
    return res.status(400).json({ success: false, error: 'organizationId required.' });
  }
  const org = await Organization.findById(req.body.organizationId);
  if (!org) return res.status(404).json({ success: false, error: 'Organization not found.' });

  lead.organization = org._id;
  lead.status = 'Won';
  lead.convertedAt = new Date();
  lead.lastTouchAt = new Date();
  await lead.save();

  await trackPlatformEvent({
    type: 'lead_converted',
    title: 'Lead converted',
    message: `${lead.companyName} → org ${org.name}`,
    actorUser: req.user._id,
    actorEmail: req.user.email,
    lead: lead._id,
    organization: org._id
  });

  res.json({ success: true, lead });
});

// ─── Activity / returns ──────────────────────────────────────────────────────

export const listEvents = asyncHandler(async (req, res) => {
  const { type, limit = 100 } = req.query;
  const filter = {};
  if (type && type !== 'All') filter.type = type;
  const events = await PlatformEvent.find(filter)
    .sort('-createdAt')
    .limit(Math.min(Number(limit) || 100, 500))
    .populate('targetUser', 'name email role')
    .populate('organization', 'name status')
    .populate('lead', 'companyName status');
  res.json({ success: true, count: events.length, events });
});

export const getLeadFunnel = asyncHandler(async (req, res) => {
  const [leadsByStatus, logins, returns, onboards, trials] = await Promise.all([
    PlatformLead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    PlatformEvent.countDocuments({ type: 'admin_login' }),
    PlatformEvent.countDocuments({ type: 'admin_return' }),
    PlatformEvent.countDocuments({ type: 'org_onboard' }),
    OrganizationSubscription.countDocuments({ status: 'Trial' })
  ]);

  res.json({
    success: true,
    funnel: {
      leadsByStatus: Object.fromEntries(leadsByStatus.map((x) => [x._id, x.count])),
      adminLogins: logins,
      adminReturns: returns,
      orgOnboards: onboards,
      activeTrials: trials
    }
  });
});

// ─── Subscription plans ──────────────────────────────────────────────────────

const PLAN_CATEGORIES = ['Free', 'Starter', 'Professional', 'Growth', 'Enterprise', 'Custom'];

function normalizeBenefits(benefits, features) {
  if (Array.isArray(benefits) && benefits.length) {
    return benefits
      .map((b) => {
        if (typeof b === 'string') return { title: b.trim(), detail: '' };
        return {
          title: String(b?.title || '').trim(),
          detail: String(b?.detail || '').trim()
        };
      })
      .filter((b) => b.title);
  }
  if (Array.isArray(features)) {
    return features
      .map((f) => String(f || '').trim())
      .filter(Boolean)
      .map((title) => ({ title, detail: '' }));
  }
  return [];
}

function buildPlanPayload(body) {
  const country = String(body.country || 'IN').trim().toUpperCase();
  const benefits = normalizeBenefits(body.benefits, body.features);
  return {
    name: String(body.name || '').trim(),
    code: String(body.code || '').trim().toUpperCase(),
    category: PLAN_CATEGORIES.includes(body.category) ? body.category : 'Starter',
    description: String(body.description || '').trim(),
    benefits,
    features: benefits.map((b) => b.title),
    country,
    countryName: String(body.countryName || country).trim(),
    currency: String(body.currency || 'INR').trim().toUpperCase(),
    priceMonthly: Number(body.priceMonthly || 0),
    priceYearly: Number(body.priceYearly || 0),
    pricingLabel: String(body.pricingLabel || '').trim(),
    trialDays: Number(body.trialDays ?? 14),
    limits: {
      vehicles: Number(body.limits?.vehicles ?? 25),
      drivers: Number(body.limits?.drivers ?? 50),
      users: Number(body.limits?.users ?? 5)
    },
    featured: body.featured === true,
    isActive: body.isActive !== false,
    sortOrder: Number(body.sortOrder || 0)
  };
}

export const listPlans = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.country && req.query.country !== 'All') {
    filter.country = String(req.query.country).trim().toUpperCase();
  }
  if (req.query.category && req.query.category !== 'All') {
    filter.category = req.query.category;
  }
  if (req.query.active === 'true') filter.isActive = true;
  if (req.query.active === 'false') filter.isActive = false;

  const plans = await SubscriptionPlan.find(filter).sort('country sortOrder name');
  res.json({ success: true, plans });
});

export const upsertPlan = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const payload = buildPlanPayload(req.body);

  if (!payload.name || !payload.code) {
    return res.status(400).json({ success: false, error: 'name and code are required.' });
  }
  if (!payload.country) {
    return res.status(400).json({ success: false, error: 'country is required.' });
  }

  let plan;
  if (id) {
    plan = await SubscriptionPlan.findById(id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found.' });

    const clash = await SubscriptionPlan.findOne({
      code: payload.code,
      country: payload.country,
      _id: { $ne: plan._id }
    });
    if (clash) {
      return res.status(409).json({
        success: false,
        error: `Plan code ${payload.code} already exists for ${payload.country}.`
      });
    }

    Object.assign(plan, payload);
    await plan.save();
    await trackPlatformEvent({
      type: 'plan_updated',
      title: 'Plan updated',
      message: `${plan.name} (${plan.country})`,
      actorUser: req.user._id,
      actorEmail: req.user.email,
      meta: { code: plan.code, country: plan.country }
    });
  } else {
    plan = await SubscriptionPlan.create(payload);
    await trackPlatformEvent({
      type: 'plan_created',
      title: 'Plan created',
      message: `${plan.name} (${plan.country})`,
      actorUser: req.user._id,
      actorEmail: req.user.email,
      meta: { code: plan.code, country: plan.country }
    });
  }

  res.status(id ? 200 : 201).json({ success: true, plan });
});

export const deletePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findById(req.params.id);
  if (!plan) return res.status(404).json({ success: false, error: 'Plan not found.' });

  const inUse = await OrganizationSubscription.countDocuments({
    plan: plan._id,
    status: { $in: ['Trial', 'Active', 'PastDue'] }
  });
  if (inUse > 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete a plan with active/trial subscriptions. Deactivate it instead.'
    });
  }

  await plan.deleteOne();
  await trackPlatformEvent({
    type: 'plan_deleted',
    title: 'Plan deleted',
    message: `${plan.name} (${plan.country})`,
    actorUser: req.user._id,
    actorEmail: req.user.email,
    meta: { code: plan.code, country: plan.country }
  });

  res.json({ success: true, message: 'Plan deleted.' });
});

export const listSubscriptions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== 'All') filter.status = status;
  const subscriptions = await OrganizationSubscription.find(filter)
    .sort('-updatedAt')
    .populate('organization', 'name status email city')
    .populate('plan', 'name code priceMonthly trialDays')
    .populate('assignedBy', 'name email');
  res.json({ success: true, subscriptions });
});

export const assignSubscription = asyncHandler(async (req, res) => {
  const { organizationId, planId, status, billingCycle, notes, startTrial } = req.body;
  if (!organizationId || !planId) {
    return res.status(400).json({
      success: false,
      error: 'organizationId and planId are required.'
    });
  }

  const [org, plan] = await Promise.all([
    Organization.findById(organizationId),
    SubscriptionPlan.findById(planId)
  ]);
  if (!org || !plan) {
    return res.status(404).json({ success: false, error: 'Organization or plan not found.' });
  }

  const now = new Date();
  const useTrial = startTrial !== false && (status === 'Trial' || !status);
  const trialEnds = new Date(now.getTime() + (plan.trialDays || 14) * 86400000);

  // End previous active/trial subs
  await OrganizationSubscription.updateMany(
    { organization: org._id, status: { $in: ['Trial', 'Active'] } },
    { $set: { status: 'Cancelled', endsAt: now } }
  );

  const sub = await OrganizationSubscription.create({
    organization: org._id,
    plan: plan._id,
    status: useTrial ? 'Trial' : status || 'Active',
    billingCycle: billingCycle || 'Monthly',
    trialStartsAt: useTrial ? now : null,
    trialEndsAt: useTrial ? trialEnds : null,
    startsAt: now,
    endsAt: useTrial ? trialEnds : null,
    notes: notes?.trim(),
    assignedBy: req.user._id
  });

  await trackPlatformEvent({
    type: useTrial ? 'trial_started' : 'subscription_assigned',
    title: useTrial ? 'Trial started' : 'Subscription assigned',
    message: `${org.name} → ${plan.name} (${useTrial ? 'Trial' : sub.status})`,
    actorUser: req.user._id,
    actorEmail: req.user.email,
    organization: org._id,
    meta: { plan: plan.code, status: sub.status, trialEndsAt: sub.trialEndsAt }
  });

  const populated = await OrganizationSubscription.findById(sub._id)
    .populate('organization', 'name status')
    .populate('plan', 'name code priceMonthly trialDays');

  res.status(201).json({ success: true, subscription: populated });
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const sub = await OrganizationSubscription.findById(req.params.id);
  if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found.' });

  if (req.body.status) sub.status = req.body.status;
  if (req.body.billingCycle) sub.billingCycle = req.body.billingCycle;
  if (req.body.notes !== undefined) sub.notes = req.body.notes?.trim();
  if (req.body.status === 'Active' && !sub.startsAt) sub.startsAt = new Date();
  if (['Cancelled', 'Expired'].includes(req.body.status)) sub.endsAt = new Date();
  await sub.save();

  await trackPlatformEvent({
    type: req.body.status === 'Expired' ? 'trial_ended' : 'subscription_renewed',
    title: 'Subscription updated',
    message: `Subscription → ${sub.status}`,
    actorUser: req.user._id,
    actorEmail: req.user.email,
    organization: sub.organization,
    meta: { status: sub.status }
  });

  const populated = await OrganizationSubscription.findById(sub._id)
    .populate('organization', 'name status')
    .populate('plan', 'name code');

  res.json({ success: true, subscription: populated });
});

export const seedDefaultPlans = asyncHandler(async (req, res) => {
  const markets = [
    { country: 'IN', countryName: 'India', currency: 'INR', monthly: [0, 2999, 7999, 0], yearly: [0, 29990, 79990, 0] },
    { country: 'AE', countryName: 'United Arab Emirates', currency: 'AED', monthly: [0, 149, 399, 0], yearly: [0, 1490, 3990, 0] },
    { country: 'US', countryName: 'United States', currency: 'USD', monthly: [0, 49, 129, 0], yearly: [0, 490, 1290, 0] }
  ];

  const templates = [
    {
      name: 'Starter',
      code: 'STARTER',
      category: 'Starter',
      description: 'For small fleet operators getting started.',
      benefits: [
        { title: 'Up to 5–25 vehicles', detail: '' },
        { title: 'Admin users included', detail: '' },
        { title: 'Basic dashboard & trip logging', detail: '' },
        { title: 'Email support', detail: '' }
      ],
      trialDays: 14,
      limits: { vehicles: 25, drivers: 50, users: 5 },
      pricingLabel: '',
      featured: false,
      sortOrder: 1
    },
    {
      name: 'Professional',
      code: 'PROFESSIONAL',
      category: 'Professional',
      description: 'For growing fleets that need full visibility.',
      benefits: [
        { title: 'Up to 50–100 vehicles', detail: '' },
        { title: 'Department billing & GST', detail: '' },
        { title: 'Live driver location', detail: '' },
        { title: 'Realtime revenue & profitability', detail: '' },
        { title: 'Priority support', detail: '' }
      ],
      trialDays: 14,
      limits: { vehicles: 100, drivers: 200, users: 15 },
      pricingLabel: '',
      featured: true,
      sortOrder: 2
    },
    {
      name: 'Growth',
      code: 'GROWTH',
      category: 'Growth',
      description: 'For operators scaling across teams and cities.',
      benefits: [
        { title: 'Everything in Professional', detail: '' },
        { title: 'Advanced reports & exports', detail: '' },
        { title: 'Activity & compliance tools', detail: '' },
        { title: 'Higher user seats', detail: '' }
      ],
      trialDays: 14,
      limits: { vehicles: 250, drivers: 500, users: 40 },
      pricingLabel: '',
      featured: false,
      sortOrder: 3
    },
    {
      name: 'Enterprise',
      code: 'ENTERPRISE',
      category: 'Enterprise',
      description: 'For large fleets with custom requirements.',
      benefits: [
        { title: 'Unlimited vehicles & users', detail: '' },
        { title: 'Multi-agency support', detail: '' },
        { title: 'Custom integrations & SLA', detail: '' },
        { title: 'Dedicated account manager', detail: '' }
      ],
      trialDays: 30,
      limits: { vehicles: 9999, drivers: 9999, users: 999 },
      pricingLabel: 'Custom',
      featured: false,
      sortOrder: 4
    }
  ];

  const results = [];
  for (const market of markets) {
    for (let i = 0; i < templates.length; i += 1) {
      const t = templates[i];
      const payload = {
        ...t,
        features: t.benefits.map((b) => b.title),
        country: market.country,
        countryName: market.countryName,
        currency: market.currency,
        priceMonthly: market.monthly[i],
        priceYearly: market.yearly[i],
        isActive: true
      };
      const plan = await SubscriptionPlan.findOneAndUpdate(
        { code: payload.code, country: payload.country },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(plan);
    }
  }
  res.json({ success: true, plans: results, count: results.length });
});

// ─── Exports ─────────────────────────────────────────────────────────────────

function parseDateBound(value, endOfDay = false) {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

function buildCreatedAtFilter(from, to) {
  const start = parseDateBound(from, false);
  const end = parseDateBound(to, true);
  if (!start && !end) return null;
  const range = {};
  if (start) range.$gte = start;
  if (end) range.$lte = end;
  return range;
}

async function collectExportRows(kind, filters = {}) {
  const { from, to, status, country, search } = filters;
  const createdAt = buildCreatedAtFilter(from, to);

  if (kind === 'leads') {
    const filter = {};
    if (createdAt) filter.createdAt = createdAt;
    if (status && status !== 'All') filter.status = status;
    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { companyName: new RegExp(q, 'i') },
        { contactName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { phone: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') }
      ];
    }
    const leads = await PlatformLead.find(filter).sort('-createdAt').lean();
    return {
      title: 'KABPRO Leads Report',
      columns: [
        { key: 'companyName', label: 'Company' },
        { key: 'contactName', label: 'Contact' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status' },
        { key: 'source', label: 'Source' },
        { key: 'city', label: 'City' },
        { key: 'createdAt', label: 'Created' }
      ],
      rows: leads.map((l) => ({
        companyName: l.companyName,
        contactName: l.contactName || '',
        email: l.email || '',
        phone: l.phone || '',
        status: l.status,
        source: l.source,
        city: l.city || '',
        createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : ''
      }))
    };
  }

  if (kind === 'events' || kind === 'activity') {
    const filter = {};
    if (createdAt) filter.createdAt = createdAt;
    if (status && status !== 'All') filter.type = status;
    const events = await PlatformEvent.find(filter).sort('-createdAt').limit(2000).lean();
    return {
      title: 'KABPRO Platform Activity',
      columns: [
        { key: 'type', label: 'Type' },
        { key: 'title', label: 'Title' },
        { key: 'message', label: 'Message' },
        { key: 'actorEmail', label: 'Actor' },
        { key: 'createdAt', label: 'When' }
      ],
      rows: events.map((e) => ({
        type: e.type,
        title: e.title,
        message: e.message || '',
        actorEmail: e.actorEmail || '',
        createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : ''
      }))
    };
  }

  if (kind === 'subscriptions') {
    const filter = {};
    if (createdAt) filter.createdAt = createdAt;
    if (status && status !== 'All') filter.status = status;
    const subs = await OrganizationSubscription.find(filter)
      .populate('organization', 'name')
      .populate('plan', 'name code country')
      .sort('-createdAt')
      .lean();
    const rows = subs
      .filter((s) => {
        if (!country || country === 'All') return true;
        return String(s.plan?.country || '').toUpperCase() === String(country).toUpperCase();
      })
      .map((s) => ({
        organization: s.organization?.name || '',
        plan: s.plan?.name || s.plan?.code || '',
        country: s.plan?.country || '',
        status: s.status,
        trialEndsAt: s.trialEndsAt ? new Date(s.trialEndsAt).toISOString() : '',
        billingCycle: s.billingCycle
      }));
    return {
      title: 'KABPRO Subscriptions',
      columns: [
        { key: 'organization', label: 'Organization' },
        { key: 'plan', label: 'Plan' },
        { key: 'country', label: 'Country' },
        { key: 'status', label: 'Status' },
        { key: 'trialEndsAt', label: 'Trial ends' },
        { key: 'billingCycle', label: 'Cycle' }
      ],
      rows
    };
  }

  if (kind === 'plans') {
    const filter = {};
    if (createdAt) filter.createdAt = createdAt;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (country && country !== 'All') filter.country = String(country).toUpperCase();
    const plans = await SubscriptionPlan.find(filter).sort('country sortOrder name').lean();
    return {
      title: 'KABPRO Subscription Plans',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'category', label: 'Category' },
        { key: 'country', label: 'Country' },
        { key: 'currency', label: 'Currency' },
        { key: 'priceMonthly', label: 'Monthly' },
        { key: 'priceYearly', label: 'Yearly' },
        { key: 'trialDays', label: 'Trial days' },
        { key: 'isActive', label: 'Active' },
        { key: 'description', label: 'Description' }
      ],
      rows: plans.map((p) => ({
        name: p.name,
        code: p.code,
        category: p.category || '',
        country: p.country,
        currency: p.currency,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        trialDays: p.trialDays,
        isActive: p.isActive ? 'Yes' : 'No',
        description: p.description || ''
      }))
    };
  }

  // organizations default
  const filter = {};
  if (createdAt) filter.createdAt = createdAt;
  if (status && status !== 'All') filter.status = status;
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') }
    ];
  }
  const orgs = await Organization.find(filter).sort('-createdAt').lean();
  return {
    title: 'KABPRO Organizations',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'email', label: 'Email' },
      { key: 'city', label: 'City' },
      { key: 'businessType', label: 'Type' },
      { key: 'createdAt', label: 'Created' }
    ],
    rows: orgs.map((o) => ({
      name: o.name,
      status: o.status,
      email: o.email || '',
      city: o.city || '',
      businessType: o.businessType || '',
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : ''
    }))
  };
}

export const exportReport = asyncHandler(async (req, res) => {
  const kind = String(req.query.kind || 'organizations');
  const format = String(req.query.format || 'xlsx').toLowerCase();
  const filters = {
    from: req.query.from || req.query.dateFrom || '',
    to: req.query.to || req.query.dateTo || '',
    status: req.query.status || '',
    country: req.query.country || '',
    search: req.query.search || ''
  };
  const { title, rows, columns } = await collectExportRows(kind, filters);
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `kabpro-${kind}-${stamp}`;

  if (format === 'pdf') {
    const buf = await buildPdfReport({ title, rows, columns });
    return sendFile(res, buf, `${base}.pdf`, 'application/pdf');
  }
  if (format === 'doc' || format === 'docx') {
    const buf = buildDocReport({ title, rows, columns });
    return sendFile(res, buf, `${base}.doc`, 'application/msword');
  }
  // default xlsx
  const buf = buildXlsxReport({ title, rows });
  return sendFile(
    res,
    buf,
    `${base}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
});
