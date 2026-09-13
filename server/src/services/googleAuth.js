import { OAuth2Client } from 'google-auth-library';

const oauthClient = new OAuth2Client();

function clientIds() {
  const raw =
    process.env.GOOGLE_CLIENT_IDS ||
    process.env.GOOGLE_CLIENT_ID ||
    '546992458715-ba6gkh5ud492pucdhrg1fi09tuhsg1e8.apps.googleusercontent.com,546992458715-8jt589ame54ts6mpnf7bjjn7s3l21r6a.apps.googleusercontent.com';

  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function verifyGoogleIdentity({ idToken, accessToken }) {
  if (idToken) {
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken,
        audience: clientIds()
      });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw Object.assign(new Error('Google token is missing an email address.'), { statusCode: 401 });
      }
      return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || null,
        emailVerified: Boolean(payload.email_verified)
      };
    } catch (err) {
      if (!accessToken) {
        throw Object.assign(new Error(err.message || 'Google ID token is invalid.'), { statusCode: 401 });
      }
    }
  }

  if (accessToken) {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.email) {
      throw Object.assign(new Error('Google access token is invalid or expired.'), { statusCode: 401 });
    }
    return {
      sub: data.sub,
      email: String(data.email).toLowerCase(),
      name: data.name || String(data.email).split('@')[0],
      picture: data.picture || null,
      emailVerified: Boolean(data.email_verified)
    };
  }

  throw Object.assign(new Error('Google idToken or accessToken is required.'), { statusCode: 400 });
}
