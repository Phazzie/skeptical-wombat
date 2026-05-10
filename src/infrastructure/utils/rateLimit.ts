/**
 * Database-backed per-user rate limiting using Neon.
 * Falls back to "allow all" when DATABASE_URL is not set.
 *
 * Uses a single atomic upsert to check-and-increment.
 * The window resets automatically when expired.
 */
import { neon } from '@neondatabase/serverless';

let tableMigrated = false;

async function ensureTable(): Promise<void> {
  if (tableMigrated || !process.env.DATABASE_URL) return;
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      user_id      VARCHAR NOT NULL,
      endpoint     VARCHAR NOT NULL,
      count        INT     NOT NULL DEFAULT 1,
      window_start TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, endpoint)
    )
  `;
  tableMigrated = true;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check and increment a rate limit counter atomically.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (!process.env.DATABASE_URL) {
    return { allowed: true, remaining: limit, resetAt: new Date() };
  }

  await ensureTable();
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    INSERT INTO rate_limits (user_id, endpoint, count, window_start)
    VALUES (${userId}, ${endpoint}, 1, NOW())
    ON CONFLICT (user_id, endpoint) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start + make_interval(secs => ${windowSeconds}::float) < NOW()
        THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start + make_interval(secs => ${windowSeconds}::float) < NOW()
        THEN NOW()
        ELSE rate_limits.window_start
      END
    RETURNING count, window_start
  `;

  const row = rows[0] as { count: number; window_start: Date };
  const resetAt = new Date(new Date(row.window_start).getTime() + windowSeconds * 1000);

  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt,
  };
}
