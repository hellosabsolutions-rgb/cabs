import { PlatformEvent } from '../models/PlatformEvent.js';
import { getIO } from './socketService.js';

/**
 * Persist a platform event and push live to Superadmin sockets.
 */
export async function trackPlatformEvent({
  type,
  title,
  message = '',
  actorUser = null,
  actorEmail = null,
  targetUser = null,
  organization = null,
  project = null,
  lead = null,
  meta = {},
  ip = null,
  userAgent = null
}) {
  const event = await PlatformEvent.create({
    type,
    title,
    message,
    actorUser,
    actorEmail,
    targetUser,
    organization,
    project,
    lead,
    meta,
    ip,
    userAgent
  });

  try {
    const io = getIO();
    const payload = {
      id: event._id.toString(),
      type: event.type,
      title: event.title,
      message: event.message,
      meta: event.meta,
      createdAt: event.createdAt,
      actorEmail: event.actorEmail
    };
    io.to('superadmin').emit('platform:event', payload);
    io.of('/notifications').to('superadmin').emit('platform:event', payload);
    io.of('/notifications').to('superadmin').emit('notification:new', {
      id: payload.id,
      title: payload.title,
      body: payload.message || payload.title,
      type: 'platform',
      createdAt: payload.createdAt
    });
  } catch {
    // Socket may not be ready during scripts
  }

  return event;
}

export async function trackAdminLogin({ user, req, isReturn = false }) {
  const type = isReturn ? 'admin_return' : 'admin_login';
  return trackPlatformEvent({
    type,
    title: isReturn ? 'Admin returned' : 'Admin logged in',
    message: `${user.email} signed in to fleet admin`,
    actorUser: user._id,
    actorEmail: user.email,
    targetUser: user._id,
    organization: user.organizationId || null,
    meta: {
      role: user.role,
      name: user.name,
      returnVisit: isReturn
    },
    ip: req?.ip || req?.socket?.remoteAddress || null,
    userAgent: req?.headers?.['user-agent'] || null
  });
}
