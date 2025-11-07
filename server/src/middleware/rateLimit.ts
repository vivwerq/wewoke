import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter per IP. Not distributed — fine for small-scale.
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = Number(process.env.TURN_RATE_WINDOW_MS || 60_000); // default 1 minute
const MAX_HITS = Number(process.env.TURN_RATE_MAX || 30); // default 30 requests per window

export default function rateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
      res.setHeader('X-RateLimit-Limit', String(MAX_HITS));
      res.setHeader('X-RateLimit-Remaining', String(MAX_HITS - 1));
      return next();
    }

    if (entry.count >= MAX_HITS) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Too many requests', retryAfter });
    }

    entry.count += 1;
    res.setHeader('X-RateLimit-Limit', String(MAX_HITS));
    res.setHeader('X-RateLimit-Remaining', String(MAX_HITS - entry.count));
    return next();
  } catch (err) {
    // On error, allow request through (fail-open) but log
    console.error('Rate limiter error', err);
    return next();
  }
}
