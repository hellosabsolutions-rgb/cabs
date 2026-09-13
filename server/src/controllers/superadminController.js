import crypto from 'crypto';
import { User } from '../models/User.js';
import { Agency } from '../models/Agency.js';
import { Organization } from '../models/Organization.js';
import { Project } from '../models/Project.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { RefreshToken } from '../models/RefreshToken.js';
import {
  generateAccessToken,
  generateRefreshToken
} from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { parseDeviceInfo } from '../utils/deviceParser.js';
import { trackPlatformEvent } from '../services/platformTracking.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { OrganizationSubscription } from '../models/OrganizationSubscription.js';

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function projectCode(orgName) {
  const base = String(orgName || 'PRJ')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase() || 'PRJ';
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${base}-${suffix}`;
}

async function refreshProjectMetrics(project) {
  const agencyId = project.agency;
  const [vehicles, drivers] = await Promise.all([
    Vehicle.countDocuments({ agencyId }),
    Driver.countDocuments({ agencyId })
  ]);

  // Bookings are not agency-scoped yet — keep prior counter / zero
  project.metrics = {
    vehicles,
    drivers,
    bookings: project.metrics?.bookings || 0,
    lastActivityAt: new Date()
  };
  await project.save();
  return project;
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || null,
    status: user.status,
    organizationId: user.organizationId?.toString?.() || user.organizationId || null,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt
  };
}

/**
 * @desc    Superadmin login
 * @route   POST /api/superadmin/auth/login
 * @access  Public
 */
export const superadminLogin = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password.'
    });
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: cleanEmail }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password.'
    });
  }

  if (user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'This account is not authorized for the Superadmin console.'
    });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({
      success: false,
      error: 'Your account has been suspended.'
    });
  }

  const device = parseDeviceInfo(req);
  const { rawToken, tokenHash, expiresAt } = generateRefreshToken(Boolean(rememberMe));

  const session = await RefreshToken.create({
    userId: user._id,
    tokenHash,
    device,
    rememberMe: Boolean(rememberMe),
    expiresAt,
    lastActiveAt: new Date()
  });

  const accessToken = generateAccessToken(user._id, session._id);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  trackPlatformEvent({
    type: 'superadmin_login',
    title: 'Superadmin logged in',
    message: `${user.email} opened the platform console`,
    actorUser: user._id,
    actorEmail: user.email,
    meta: { role: 'superadmin' },
    ip: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null
  }).catch(() => {});

  res.status(200).json({
    success: true,
    token: accessToken,
    accessToken,
    refreshToken: rawToken,
    user: serializeUser(user)
  });
});

/**
 * @desc    Current superadmin profile
 * @route   GET /api/superadmin/auth/me
 * @access  Superadmin
 */
export const superadminMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: serializeUser(req.user)
  });
});

/**
 * @desc    Platform overview for tracking
 * @route   GET /api/superadmin/dashboard
 * @access  Superadmin
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const [
    orgTotal,
    orgPending,
    orgActive,
    orgSuspended,
    projectTotal,
    projectOnboarding,
    projectActive,
    adminUsers,
    recentOrgs,
    recentProjects
  ] = await Promise.all([
    Organization.countDocuments(),
    Organization.countDocuments({ status: 'Pending' }),
    Organization.countDocuments({ status: 'Active' }),
    Organization.countDocuments({ status: 'Suspended' }),
    Project.countDocuments(),
    Project.countDocuments({ status: 'Onboarding' }),
    Project.countDocuments({ status: 'Active' }),
    User.countDocuments({ role: { $in: ['admin', 'manager', 'operator'] } }),
    Organization.find().sort('-createdAt').limit(8).populate('primaryAdmin', 'name email'),
    Project.find()
      .sort('-updatedAt')
      .limit(8)
      .populate('organization', 'name status')
      .populate('adminUser', 'name email lastLoginAt')
      .populate('agency', 'name')
  ]);

  res.status(200).json({
    success: true,
    overview: {
      organizations: {
        total: orgTotal,
        pending: orgPending,
        active: orgActive,
        suspended: orgSuspended
      },
      projects: {
        total: projectTotal,
        onboarding: projectOnboarding,
        active: projectActive
      },
      adminUsers
    },
    recentOrganizations: recentOrgs,
    recentProjects
  });
});

/**
 * @desc    Onboard organization + admin user + agency + project
 * @route   POST /api/superadmin/organizations/onboard
 * @access  Superadmin
 */
export const onboardOrganization = asyncHandler(async (req, res) => {
  const {
    name,
    businessType,
    phone,
    email,
    address,
    city,
    state,
    gstin,
    pan,
    notes,
    plan,
    projectName,
    adminName,
    adminEmail,
    adminPassword,
    adminPhone,
    activate
  } = req.body;

  if (!name?.trim() || !adminName?.trim() || !adminEmail?.trim() || !adminPassword) {
    return res.status(400).json({
      success: false,
      error: 'Organization name, admin name, email, and password are required.'
    });
  }

  if (String(adminPassword).length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Admin password must be at least 6 characters.'
    });
  }

  const cleanAdminEmail = String(adminEmail).toLowerCase().trim();
  const existing = await User.findOne({ email: cleanAdminEmail });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'An admin account with this email already exists.'
    });
  }

  let slug = slugify(name);
  if (slug) {
    const slugTaken = await Organization.findOne({ slug });
    if (slugTaken) slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
  }

  const orgStatus = activate ? 'Active' : 'Pending';
  const projectStatus = activate ? 'Active' : 'Onboarding';

  const organization = await Organization.create({
    name: name.trim(),
    slug: slug || undefined,
    businessType: businessType || 'Cab & Taxi Fleet',
    status: orgStatus,
    phone: phone?.trim(),
    email: email ? String(email).toLowerCase().trim() : cleanAdminEmail,
    address: address?.trim(),
    city: city?.trim(),
    state: state?.trim(),
    gstin: gstin?.trim()?.toUpperCase(),
    pan: pan?.trim()?.toUpperCase(),
    notes: notes?.trim(),
    onboardedBy: req.user._id,
    onboardedAt: new Date(),
    activatedAt: activate ? new Date() : null
  });

  const adminUser = await User.create({
    name: adminName.trim(),
    email: cleanAdminEmail,
    password: adminPassword,
    phone: adminPhone?.trim() || phone?.trim(),
    role: 'admin',
    status: 'Active',
    organizationId: organization._id
  });

  const agency = await Agency.create({
    name: name.trim(),
    owner: adminUser._id,
    businessType: businessType || 'Cab & Taxi Fleet',
    phone: phone?.trim() || adminPhone?.trim(),
    email: organization.email,
    address: address?.trim(),
    city: city?.trim(),
    state: state?.trim(),
    gstin: gstin?.trim()?.toUpperCase(),
    pan: pan?.trim()?.toUpperCase(),
    isDefault: true,
    organizationId: organization._id,
    onboardStatus: 'Provisioned'
  });

  adminUser.agencies = [agency._id];
  adminUser.currentAgency = agency._id;
  await adminUser.save();

  const project = await Project.create({
    name: (projectName || `${name.trim()} Fleet`).trim(),
    code: projectCode(name),
    organization: organization._id,
    agency: agency._id,
    adminUser: adminUser._id,
    status: projectStatus,
    plan: plan || 'Trial',
    createdBy: req.user._id,
    goLiveAt: activate ? new Date() : null,
    metrics: { vehicles: 0, drivers: 0, bookings: 0, lastActivityAt: null }
  });

  agency.projectId = project._id;
  await agency.save();

  organization.primaryAdmin = adminUser._id;
  organization.primaryAgency = agency._id;
  await organization.save();

  // Auto-start trial on onboard (superadmin subscription layer — not wired to admin UI)
  let trialPlan =
    (await SubscriptionPlan.findOne({ code: 'STARTER', country: 'IN', isActive: true })) ||
    (await SubscriptionPlan.findOne({ code: 'TRIAL', isActive: true })) ||
    (await SubscriptionPlan.findOne({ isActive: true }).sort('sortOrder'));

  if (!trialPlan) {
    trialPlan = await SubscriptionPlan.create({
      name: 'Starter',
      code: 'STARTER',
      category: 'Starter',
      description: 'Default evaluation trial',
      country: 'IN',
      countryName: 'India',
      currency: 'INR',
      priceMonthly: 0,
      pricingLabel: 'Free trial',
      trialDays: 14,
      benefits: [
        { title: 'Core fleet', detail: '' },
        { title: 'Drivers & bookings', detail: '' }
      ],
      features: ['Core fleet', 'Drivers & bookings'],
      limits: { vehicles: 10, drivers: 20, users: 3 },
      sortOrder: 0
    });
  }
  const now = new Date();
  const trialEnds = new Date(now.getTime() + (trialPlan.trialDays || 14) * 86400000);
  await OrganizationSubscription.create({
    organization: organization._id,
    plan: trialPlan._id,
    status: 'Trial',
    billingCycle: 'Monthly',
    trialStartsAt: now,
    trialEndsAt: trialEnds,
    startsAt: now,
    endsAt: trialEnds,
    assignedBy: req.user._id,
    notes: 'Auto-started on organization onboard'
  });

  await trackPlatformEvent({
    type: 'org_onboard',
    title: 'Organization onboarded',
    message: `${organization.name} provisioned with admin ${adminUser.email}`,
    actorUser: req.user._id,
    actorEmail: req.user.email,
    organization: organization._id,
    project: project._id,
    targetUser: adminUser._id,
    meta: { plan: trialPlan.code, trialEndsAt: trialEnds }
  });

  await trackPlatformEvent({
    type: 'trial_started',
    title: 'Trial started',
    message: `${organization.name} on ${trialPlan.name}`,
    actorUser: req.user._id,
    actorEmail: req.user.email,
    organization: organization._id,
    meta: { plan: trialPlan.code, trialEndsAt: trialEnds }
  });

  const populated = await Organization.findById(organization._id)
    .populate('primaryAdmin', 'name email phone status lastLoginAt')
    .populate('primaryAgency', 'name city businessType');

  res.status(201).json({
    success: true,
    message: 'Organization onboarded successfully.',
    organization: populated,
    project,
    admin: serializeUser(adminUser),
    temporaryCredentials: {
      email: cleanAdminEmail,
      note: 'Share the password securely with the customer admin. They can change it after first login.'
    }
  });
});

/**
 * @desc    List organizations
 * @route   GET /api/superadmin/organizations
 */
export const listOrganizations = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (status && status !== 'All') filter.status = status;
  if (search?.trim()) {
    filter.$or = [
      { name: new RegExp(search.trim(), 'i') },
      { email: new RegExp(search.trim(), 'i') },
      { city: new RegExp(search.trim(), 'i') }
    ];
  }

  const organizations = await Organization.find(filter)
    .sort('-createdAt')
    .populate('primaryAdmin', 'name email phone status lastLoginAt')
    .populate('primaryAgency', 'name city');

  const withCounts = await Promise.all(
    organizations.map(async (org) => {
      const projectCount = await Project.countDocuments({ organization: org._id });
      return { ...org.toJSON(), projectCount };
    })
  );

  res.status(200).json({
    success: true,
    count: withCounts.length,
    organizations: withCounts
  });
});

/**
 * @desc    Organization detail + projects + tracking
 * @route   GET /api/superadmin/organizations/:id
 */
export const getOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id)
    .populate('primaryAdmin', 'name email phone status lastLoginAt createdAt')
    .populate('primaryAgency')
    .populate('onboardedBy', 'name email');

  if (!organization) {
    return res.status(404).json({ success: false, error: 'Organization not found.' });
  }

  const projects = await Project.find({ organization: organization._id })
    .sort('-createdAt')
    .populate('adminUser', 'name email lastLoginAt status')
    .populate('agency', 'name city onboardStatus');

  // Refresh metrics for active tracking
  for (const p of projects) {
    await refreshProjectMetrics(p);
  }

  const refreshed = await Project.find({ organization: organization._id })
    .sort('-createdAt')
    .populate('adminUser', 'name email lastLoginAt status')
    .populate('agency', 'name city onboardStatus');

  res.status(200).json({
    success: true,
    organization,
    projects: refreshed
  });
});

/**
 * @desc    Update organization status / profile
 * @route   PATCH /api/superadmin/organizations/:id
 */
export const updateOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id);
  if (!organization) {
    return res.status(404).json({ success: false, error: 'Organization not found.' });
  }

  const allowed = [
    'name',
    'businessType',
    'status',
    'phone',
    'email',
    'address',
    'city',
    'state',
    'gstin',
    'pan',
    'notes'
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      organization[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
    }
  }

  if (req.body.status === 'Active' && !organization.activatedAt) {
    organization.activatedAt = new Date();
  }

  await organization.save();

  // Mirror suspend to primary admin
  if (req.body.status === 'Suspended' && organization.primaryAdmin) {
    await User.findByIdAndUpdate(organization.primaryAdmin, { status: 'Suspended' });
    await Project.updateMany(
      { organization: organization._id, status: { $ne: 'Archived' } },
      { $set: { status: 'Paused' } }
    );
  }
  if (req.body.status === 'Active' && organization.primaryAdmin) {
    await User.findByIdAndUpdate(organization.primaryAdmin, { status: 'Active' });
  }

  res.status(200).json({ success: true, organization });
});

/**
 * @desc    List projects (tracked admin workspaces)
 * @route   GET /api/superadmin/projects
 */
export const listProjects = asyncHandler(async (req, res) => {
  const { status, organizationId, search } = req.query;
  const filter = {};
  if (status && status !== 'All') filter.status = status;
  if (organizationId) filter.organization = organizationId;

  let projects = await Project.find(filter)
    .sort('-updatedAt')
    .populate('organization', 'name status city')
    .populate('adminUser', 'name email status lastLoginAt')
    .populate('agency', 'name city onboardStatus');

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    projects = projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.organization?.name?.toLowerCase().includes(q) ||
        p.adminUser?.email?.toLowerCase().includes(q)
    );
  }

  // Soft refresh metrics (best-effort, non-blocking for list size)
  await Promise.all(projects.slice(0, 25).map((p) => refreshProjectMetrics(p).catch(() => p)));

  const refreshed = await Project.find({ _id: { $in: projects.map((p) => p._id) } })
    .sort('-updatedAt')
    .populate('organization', 'name status city')
    .populate('adminUser', 'name email status lastLoginAt')
    .populate('agency', 'name city onboardStatus');

  res.status(200).json({
    success: true,
    count: refreshed.length,
    projects: refreshed
  });
});

/**
 * @desc    Create additional project under an org (new agency + optional admin)
 * @route   POST /api/superadmin/projects
 */
export const createProject = asyncHandler(async (req, res) => {
  const {
    organizationId,
    name,
    plan,
    notes,
    adminUserId,
    newAdminName,
    newAdminEmail,
    newAdminPassword,
    activate
  } = req.body;

  if (!organizationId || !name?.trim()) {
    return res.status(400).json({
      success: false,
      error: 'organizationId and project name are required.'
    });
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    return res.status(404).json({ success: false, error: 'Organization not found.' });
  }

  let adminUser = null;
  if (adminUserId) {
    adminUser = await User.findById(adminUserId);
    if (!adminUser) {
      return res.status(404).json({ success: false, error: 'Admin user not found.' });
    }
  } else if (newAdminEmail && newAdminPassword && newAdminName) {
    const clean = String(newAdminEmail).toLowerCase().trim();
    if (await User.findOne({ email: clean })) {
      return res.status(409).json({ success: false, error: 'Admin email already exists.' });
    }
    adminUser = await User.create({
      name: newAdminName.trim(),
      email: clean,
      password: newAdminPassword,
      role: 'admin',
      status: 'Active',
      organizationId: organization._id
    });
  } else if (organization.primaryAdmin) {
    adminUser = await User.findById(organization.primaryAdmin);
  }

  if (!adminUser) {
    return res.status(400).json({
      success: false,
      error: 'Provide adminUserId or new admin credentials (or onboard org with a primary admin first).'
    });
  }

  const agency = await Agency.create({
    name: name.trim(),
    owner: adminUser._id,
    businessType: organization.businessType,
    phone: organization.phone || adminUser.phone,
    email: organization.email || adminUser.email,
    city: organization.city,
    state: organization.state,
    address: organization.address,
    isDefault: !adminUser.currentAgency,
    organizationId: organization._id,
    onboardStatus: 'Provisioned'
  });

  if (!adminUser.agencies?.some((id) => id.toString() === agency._id.toString())) {
    adminUser.agencies = [...(adminUser.agencies || []), agency._id];
  }
  if (!adminUser.currentAgency) adminUser.currentAgency = agency._id;
  if (!adminUser.organizationId) adminUser.organizationId = organization._id;
  await adminUser.save();

  const project = await Project.create({
    name: name.trim(),
    code: projectCode(name),
    organization: organization._id,
    agency: agency._id,
    adminUser: adminUser._id,
    status: activate ? 'Active' : 'Onboarding',
    plan: plan || 'Trial',
    notes: notes?.trim(),
    createdBy: req.user._id,
    goLiveAt: activate ? new Date() : null
  });

  agency.projectId = project._id;
  await agency.save();

  const populated = await Project.findById(project._id)
    .populate('organization', 'name status')
    .populate('adminUser', 'name email')
    .populate('agency', 'name');

  res.status(201).json({ success: true, project: populated });
});

/**
 * @desc    Update project status / plan / notes
 * @route   PATCH /api/superadmin/projects/:id
 */
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }

  const allowed = ['name', 'status', 'plan', 'notes'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      project[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
    }
  }

  if (req.body.status === 'Active' && !project.goLiveAt) {
    project.goLiveAt = new Date();
    if (project.agency) {
      await Agency.findByIdAndUpdate(project.agency, { onboardStatus: 'Active' });
    }
  }

  await project.save();
  await refreshProjectMetrics(project);

  const populated = await Project.findById(project._id)
    .populate('organization', 'name status')
    .populate('adminUser', 'name email lastLoginAt status')
    .populate('agency', 'name city onboardStatus');

  res.status(200).json({ success: true, project: populated });
});

/**
 * @desc    List admin users managed / tracked by platform
 * @route   GET /api/superadmin/users
 */
export const listTrackedUsers = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const filter = { role: { $in: ['admin', 'manager', 'operator'] } };
  if (status && status !== 'All') filter.status = status;
  if (search?.trim()) {
    filter.$or = [
      { name: new RegExp(search.trim(), 'i') },
      { email: new RegExp(search.trim(), 'i') }
    ];
  }

  const users = await User.find(filter)
    .sort('-createdAt')
    .select('name email role phone status organizationId currentAgency lastLoginAt createdAt')
    .populate('organizationId', 'name status')
    .populate('currentAgency', 'name city');

  res.status(200).json({
    success: true,
    count: users.length,
    users
  });
});

/**
 * @desc    Suspend / activate an admin user
 * @route   PATCH /api/superadmin/users/:id
 */
export const updateTrackedUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }
  if (user.role === 'superadmin') {
    return res.status(403).json({ success: false, error: 'Cannot modify superadmin accounts here.' });
  }

  if (req.body.status && ['Active', 'Suspended'].includes(req.body.status)) {
    user.status = req.body.status;
  }
  if (req.body.name) user.name = req.body.name.trim();
  if (req.body.phone !== undefined) user.phone = req.body.phone?.trim() || undefined;

  await user.save();

  res.status(200).json({ success: true, user: serializeUser(user) });
});
