import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate Supabase session token provided either in:
 * - Authorization: Bearer <token>
 * - Cookie: supabase-auth-token=<token> or sb:token=<token>
 *
 * If TURN_REQUIRE_AUTH is not 'true' this middleware is a no-op.
 */
export default async function requireSessionAuth(req: Request, res: Response, next: NextFunction) {
  const requireAuth = String(process.env.TURN_REQUIRE_AUTH || 'false').toLowerCase() === 'true';
  if (!requireAuth) return next();

  // Try Authorization header first
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Fallback to cookie parsing for common Supabase cookie names
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    for (const c of cookies) {
      if (c.startsWith('supabase-auth-token=')) {
        // supabase-auth-token often stores a JSON string; attempt to parse
        try {
          const raw = decodeURIComponent(c.split('=')[1]);
          // often the format is a JSON with access_token property
          const parsed = JSON.parse(raw);
          if (parsed?.access_token) {
            token = parsed.access_token;
            break;
          }
        } catch (e) {
          // fallback to raw token
          token = c.split('=')[1];
          break;
        }
      }
      if (c.startsWith('sb:token=') || c.startsWith('sb-access-token=')) {
        token = c.split('=')[1];
        break;
      }
    }
  }

  if (!token) return res.status(401).json({ error: 'Missing session token' });

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

    const userJson = await userResp.json();
    // attach user to request
    // @ts-ignore
    req.user = userJson;
    return next();
  } catch (err) {
    console.error('Error validating session token with Supabase:', err);
    return res.status(500).json({ error: 'Token validation failed' });
  }
}
