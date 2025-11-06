import express from 'express';
import crypto from 'crypto';
import requireAuth from '../middleware/requireAuth.js';
import requireSessionAuth from '../middleware/requireSessionAuth.js';

const router = express.Router();

/**
 * GET /turn-credentials
 * Returns ephemeral TURN credentials when TURN_SHARED_SECRET is configured.
 * If TURN_SHARED_SECRET is not set but TURN_USERNAME and TURN_PASSWORD are present,
 * returns the static credentials (less secure).
 */
router.get('/turn-credentials', requireAuth, (req, res) => {
  const TURN_URL = process.env.TURN_SERVER_URL; // e.g. turn.your-domain.com:3478
  const sharedSecret = process.env.TURN_SHARED_SECRET;
  const staticUser = process.env.TURN_USERNAME;
  const staticPass = process.env.TURN_PASSWORD;

  if (!TURN_URL) {
    return res.status(400).json({ error: 'TURN_SERVER_URL not configured' });
  }

  // If shared secret is configured, issue time-limited credentials per coturn REST style
  if (sharedSecret) {
    // TTL in seconds
    const ttl = Number(process.env.TURN_EPHEMERAL_TTL || 300); // default 5 minutes
    const expiry = Math.floor(Date.now() / 1000) + ttl;

    // username format: <expiry>:<optional-identifier>
    const username = String(expiry) + ':' + (req.query.userId || 'anon');

    // credential is HMAC-SHA1 of username using shared secret, base64
    const hmac = crypto.createHmac('sha1', sharedSecret).update(username).digest('base64');

    return res.json({
      username,
      credential: hmac,
      ttl,
      urls: [
        `turn:${TURN_URL}?transport=udp`,
        `turn:${TURN_URL}?transport=tcp`,
        // For TLS port if your coturn exposes 5349
        `turns:${TURN_URL}?transport=tcp`
      ]
    });
  }

  // Fallback to static credentials if provided (not recommended for production)
  if (staticUser && staticPass) {
    return res.json({
      username: staticUser,
      credential: staticPass,
      ttl: null,
      urls: [
        `turn:${TURN_URL}?transport=udp`,
        `turn:${TURN_URL}?transport=tcp`
      ]
    });
  }

  return res.status(403).json({ error: 'No TURN credential configuration found' });
});

// Authenticated endpoint that requires a valid Supabase session (cookie or header)
// This endpoint is intended for cases where you want to ensure only logged-in users
// can obtain TURN credentials. Behavior is identical to /turn-credentials but
// requires a valid session token (TURN_REQUIRE_AUTH must also be true to activate).
router.get('/turn-credentials-auth', requireSessionAuth, (req, res) => {
  const TURN_URL = process.env.TURN_SERVER_URL; // e.g. turn.your-domain.com:3478
  const sharedSecret = process.env.TURN_SHARED_SECRET;
  const staticUser = process.env.TURN_USERNAME;
  const staticPass = process.env.TURN_PASSWORD;

  if (!TURN_URL) {
    return res.status(400).json({ error: 'TURN_SERVER_URL not configured' });
  }

  if (sharedSecret) {
    const ttl = Number(process.env.TURN_EPHEMERAL_TTL || 300);
    const expiry = Math.floor(Date.now() / 1000) + ttl;
    const username = String(expiry) + ':' + (req.query.userId || (req as any).user?.id || 'auth-user');
    const hmac = crypto.createHmac('sha1', sharedSecret).update(username).digest('base64');

    return res.json({ username, credential: hmac, ttl, urls: [
      `turn:${TURN_URL}?transport=udp`,
      `turn:${TURN_URL}?transport=tcp`,
      `turns:${TURN_URL}?transport=tcp`
    ]});
  }

  if (staticUser && staticPass) {
    return res.json({ username: staticUser, credential: staticPass, ttl: null, urls: [
      `turn:${TURN_URL}?transport=udp`,
      `turn:${TURN_URL}?transport=tcp`
    ]});
  }

  return res.status(403).json({ error: 'No TURN credential configuration found' });
});

export default router;
