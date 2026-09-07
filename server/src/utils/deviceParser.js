/**
 * Device and Browser Parser Utility for Authentication & Session Tracking
 */

export function parseDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || '';
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  // Normalize IP (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
  const cleanIp = ip.replace(/^::ffff:/, '');

  let os = 'Unknown OS';
  if (/Mac OS X|Macintosh/i.test(userAgent)) {
    os = 'macOS';
  } else if (/Windows NT/i.test(userAgent)) {
    os = 'Windows';
  } else if (/Android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    os = 'iOS';
  } else if (/Linux/i.test(userAgent)) {
    os = 'Linux';
  } else if (/CrOS/i.test(userAgent)) {
    os = 'ChromeOS';
  }

  let browser = 'Unknown Browser';
  if (/Edg\//i.test(userAgent)) {
    browser = 'Microsoft Edge';
  } else if (/OPR\/|Opera/i.test(userAgent)) {
    browser = 'Opera';
  } else if (/Chrome\/|CriOS/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Firefox|FxiOS/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/Safari/i.test(userAgent) && !/Chrome|CriOS/i.test(userAgent)) {
    browser = 'Safari';
  }

  let deviceType = 'desktop';
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/Mobile|iPhone|Android/i.test(userAgent)) {
    deviceType = 'mobile';
  }

  const label = `${browser} on ${os}`;

  return {
    deviceType,
    browser,
    os,
    ip: cleanIp,
    userAgent,
    label
  };
}
