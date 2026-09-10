import crypto from 'crypto';
import { Agency } from '../models/Agency.js';
import { User } from '../models/User.js';
import { StaffInvitation } from '../models/StaffInvitation.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { eventBus } from '../services/eventBus.js';

/**
 * @desc    Create a new Agency / Company (Onboarding or new branch)
 * @route   POST /api/agencies
 * @access  Private
 */
export const createAgency = asyncHandler(async (req, res) => {
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
    logo
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Agency / Company name is required.'
    });
  }

  const hasLocation = Boolean(city && (state || address));
  const hasKyc = Boolean(gstin || pan);

  let onboardingPhase = 'Phase 2: Base & Location';
  let onboardingStep = 2;
  let onboardingProgress = 35;
  let onboardingStatus = 'In Progress';

  if (hasLocation && !hasKyc) {
    onboardingPhase = 'Phase 3: KYC & Compliance';
    onboardingStep = 3;
    onboardingProgress = 50;
    onboardingStatus = 'KYC Pending';
  } else if (hasLocation && hasKyc) {
    onboardingPhase = 'Phase 4: Fleet & Vehicles';
    onboardingStep = 4;
    onboardingProgress = 65;
    onboardingStatus = 'Awaiting Fleet';
  }

  // Create agency
  const agency = await Agency.create({
    name: name.trim(),
    owner: req.user._id,
    businessType: businessType || 'Department & Tour Operator',
    phone: phone ? phone.trim() : req.user.phone,
    email: email ? email.trim().toLowerCase() : req.user.email,
    address: address ? address.trim() : undefined,
    city: city ? city.trim() : undefined,
    state: state ? state.trim() : undefined,
    gstin: gstin ? gstin.trim().toUpperCase() : undefined,
    pan: pan ? pan.trim().toUpperCase() : undefined,
    logo: logo || null,
    isDefault: !req.user.currentAgency,
    onboardingPhase,
    onboardingStep,
    onboardingProgress,
    onboardingStatus,
    onboardingChecklist: {
      profileCompleted: true,
      locationCompleted: Boolean(hasLocation),
      taxKycSubmitted: Boolean(hasKyc),
      firstVehicleAdded: false,
      firstDriverAdded: false,
      documentsVerified: false
    }
  });

  // Attach to user and set as currentAgency
  const user = await User.findById(req.user._id);
  user.agencies.push(agency._id);
  user.currentAgency = agency._id;
  await user.save();

  // Notify SuperAdmin real-time event pipeline
  eventBus.emit('superadmin:audit', {
    action: 'AGENCY_ONBOARDING_STARTED',
    actor: `${req.user.name || 'Client'} (${agency.name})`,
    text: `started onboarding for <b>${agency.name}</b> — entered <b>${onboardingPhase}</b>`,
    targetId: String(agency._id)
  });

  res.status(201).json({
    success: true,
    message: 'Agency created successfully.',
    agency
  });
});

/**
 * @desc    Get all agencies belonging to current user
 * @route   GET /api/agencies
 * @access  Private
 */
export const getMyAgencies = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('currentAgency');

  // Find all agencies owned by or linked to this user
  const agencies = await Agency.find({
    $or: [{ owner: req.user._id }, { _id: { $in: user.agencies || [] } }]
  }).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: agencies.length,
    currentAgency: user.currentAgency || agencies[0] || null,
    agencies
  });
});

/**
 * @desc    Get single agency by ID
 * @route   GET /api/agencies/:id
 * @access  Private
 */
export const getAgencyById = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id);

  if (!agency) {
    return res.status(404).json({
      success: false,
      error: 'Agency not found.'
    });
  }

  res.status(200).json({
    success: true,
    agency
  });
});

/**
 * @desc    Update agency profile
 * @route   PUT /api/agencies/:id
 * @access  Private
 */
export const updateAgency = asyncHandler(async (req, res) => {
  const agency = await Agency.findById(req.params.id);

  if (!agency) {
    return res.status(404).json({
      success: false,
      error: 'Agency not found.'
    });
  }

  // Verify ownership
  if (agency.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this agency profile.'
    });
  }

  const updatedAgency = await Agency.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Agency profile updated successfully.',
    agency: updatedAgency
  });
});

/**
 * @desc    Switch user's currently active agency
 * @route   POST /api/agencies/switch/:id
 * @access  Private
 */
export const switchAgency = asyncHandler(async (req, res) => {
  const targetAgency = await Agency.findById(req.params.id);

  if (!targetAgency) {
    return res.status(404).json({
      success: false,
      error: 'Selected agency does not exist.'
    });
  }

  // Update currentAgency on user
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { currentAgency: targetAgency._id },
    { new: true }
  ).populate('currentAgency');

  res.status(200).json({
    success: true,
    message: `Switched to ${targetAgency.name}`,
    currentAgency: user.currentAgency
  });
});

/**
 * @desc    Delete an agency
 * @route   DELETE /api/agencies/:id
 * @access  Private
 */
export const deleteAgency = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.agencies.length <= 1) {
    return res.status(400).json({
      success: false,
      error: 'You must have at least one active agency. Cannot delete your only agency.'
    });
  }

  await Agency.findByIdAndDelete(req.params.id);

  // Remove from user's agencies
  user.agencies = user.agencies.filter(
    id => id.toString() !== req.params.id.toString()
  );

  if (user.currentAgency && user.currentAgency.toString() === req.params.id.toString()) {
    user.currentAgency = user.agencies[0] || null;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Agency removed successfully.',
    currentAgencyId: user.currentAgency
  });
});

/**
 * @desc    Get all staff members and pending invitations for an agency
 * @route   GET /api/agencies/:id/staff
 * @access  Private
 */
export const getAgencyStaff = asyncHandler(async (req, res) => {
  const agencyId = req.params.id;
  const agency = await Agency.findById(agencyId);

  if (!agency) {
    return res.status(404).json({
      success: false,
      error: 'Agency not found.'
    });
  }

  // Get active staff members belonging to this agency
  const staff = await User.find({
    $or: [{ currentAgency: agencyId }, { agencies: agencyId }]
  }).select('name email role phone avatar status lastLoginAt createdAt').sort('-createdAt');

  // Mark expired invitations
  await StaffInvitation.updateMany(
    { agency: agencyId, status: 'pending', expiresAt: { $lt: new Date() } },
    { status: 'expired' }
  );

  // Get pending invitations
  const invitations = await StaffInvitation.find({
    agency: agencyId,
    status: 'pending'
  }).populate('invitedBy', 'name email').sort('-createdAt');

  res.status(200).json({
    success: true,
    agencyId,
    agencyName: agency.name,
    staff,
    invitations
  });
});

/**
 * @desc    Invite a staff member to an agency via Email ID
 * @route   POST /api/agencies/:id/invite
 * @access  Private
 */
export const inviteAgencyStaff = asyncHandler(async (req, res) => {
  const agencyId = req.params.id;
  const { email, name, role } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Staff email address is required.'
    });
  }

  const cleanEmail = email.toLowerCase().trim();
  const agency = await Agency.findById(agencyId);

  if (!agency) {
    return res.status(404).json({
      success: false,
      error: 'Agency not found.'
    });
  }

  // Verify sender has admin/manager rights or is owner
  const isOwner = agency.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Only the agency owner or an administrator can invite staff members.'
    });
  }

  // Check if user is already an active member of this agency
  const existingUser = await User.findOne({
    email: cleanEmail,
    $or: [{ currentAgency: agencyId }, { agencies: agencyId }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: `A user with email ${cleanEmail} is already a member of this agency.`
    });
  }

  // Generate unique inviteCode and token
  const inviteCode = `STF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const inviteToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Check if there is already a pending invite for this email in this agency
  let invitation = await StaffInvitation.findOne({
    agency: agencyId,
    email: cleanEmail,
    status: 'pending'
  });

  if (invitation) {
    invitation.inviteCode = inviteCode;
    invitation.inviteToken = inviteToken;
    invitation.role = role || 'operator';
    invitation.name = name ? name.trim() : invitation.name;
    invitation.expiresAt = expiresAt;
    invitation.invitedBy = req.user._id;
    await invitation.save();
  } else {
    invitation = await StaffInvitation.create({
      email: cleanEmail,
      agency: agencyId,
      invitedBy: req.user._id,
      name: name ? name.trim() : '',
      role: role || 'operator',
      inviteCode,
      inviteToken,
      expiresAt
    });
  }

  // Audit event
  eventBus.emit('superadmin:audit', {
    action: 'STAFF_INVITED',
    actor: `${req.user.name || 'Admin'} (${agency.name})`,
    text: `invited <b>${name || cleanEmail}</b> (${cleanEmail}) as <b>${role || 'operator'}</b>`,
    targetId: String(invitation._id)
  });

  res.status(201).json({
    success: true,
    message: `Invitation successfully created for ${cleanEmail}.`,
    invitation: {
      id: invitation._id,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      inviteCode: invitation.inviteCode,
      inviteToken: invitation.inviteToken,
      expiresAt: invitation.expiresAt,
      status: invitation.status
    }
  });
});

/**
 * @desc    Revoke a staff invitation
 * @route   DELETE /api/agencies/:id/invite/:inviteId
 * @access  Private
 */
export const revokeStaffInvitation = asyncHandler(async (req, res) => {
  const { id: agencyId, inviteId } = req.params;

  const invitation = await StaffInvitation.findOne({
    _id: inviteId,
    agency: agencyId
  });

  if (!invitation) {
    return res.status(404).json({
      success: false,
      error: 'Invitation not found.'
    });
  }

  invitation.status = 'revoked';
  await invitation.save();

  res.status(200).json({
    success: true,
    message: 'Invitation has been revoked successfully.'
  });
});

/**
 * @desc    Remove a staff member from an agency
 * @route   DELETE /api/agencies/:id/staff/:userId
 * @access  Private
 */
export const removeAgencyStaff = asyncHandler(async (req, res) => {
  const { id: agencyId, userId } = req.params;
  const agency = await Agency.findById(agencyId);

  if (!agency) {
    return res.status(404).json({
      success: false,
      error: 'Agency not found.'
    });
  }

  // Prevent removing agency owner
  if (agency.owner.toString() === userId.toString()) {
    return res.status(400).json({
      success: false,
      error: 'Cannot remove the primary agency owner.'
    });
  }

  const staffUser = await User.findById(userId);
  if (!staffUser) {
    return res.status(404).json({
      success: false,
      error: 'User not found.'
    });
  }

  staffUser.agencies = staffUser.agencies.filter(
    aId => aId.toString() !== agencyId.toString()
  );

  if (staffUser.currentAgency && staffUser.currentAgency.toString() === agencyId.toString()) {
    staffUser.currentAgency = staffUser.agencies[0] || null;
  }

  await staffUser.save();

  res.status(200).json({
    success: true,
    message: `Staff access removed for ${staffUser.name || staffUser.email}.`
  });
});
