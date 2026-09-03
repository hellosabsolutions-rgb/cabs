import { Agency } from '../models/Agency.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

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
    isDefault: !req.user.currentAgency
  });

  // Attach to user and set as currentAgency
  const user = await User.findById(req.user._id);
  user.agencies.push(agency._id);
  user.currentAgency = agency._id;
  await user.save();

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
