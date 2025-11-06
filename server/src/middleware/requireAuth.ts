import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to require a valid Supabase JWT on certain endpoints.
 * Behavior:
 * - If TURN_REQUIRE_AUTH is not set to 'true', middleware is a no-op.
 * - If TURN_REQUIRE_AUTH === 'true', expects Authorization: Bearer <token> and
 *   validates it using Supabase Auth user endpoint: `${SUPABASE_URL}/auth/v1/user`.
 */
export default async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const requireAuth = String(process.env.TURN_REQUIRE_AUTH || 'false').toLowerCase() === 'true';
  if (!requireAuth) return next();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = auth.split(' ')[1];
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) return res.status(500).json({ error: 'SUPABASE_URL not configured on server' });

  try {
    const userResp = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!userResp.ok) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Optionally we could attach user info to req for downstream use
    const userJson = await userResp.json();
    // @ts-ignore
    req.user = userJson;
    return next();
  } catch (err) {
    console.error('Error validating token with Supabase:', err);
    return res.status(500).json({ error: 'Token validation failed' });
  }
}
