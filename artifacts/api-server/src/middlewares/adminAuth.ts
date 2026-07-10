import { type Request, type Response, type NextFunction } from "express";

/**
 * Simple admin authentication middleware.
 * Requires the request to carry one of:
 *   - Header:  X-Admin-Key: <value of ADMIN_API_KEY env var>
 *   - Query:   ?adminKey=<value>
 *
 * Set ADMIN_API_KEY in your environment. If the env var is not set,
 * admin routes are disabled entirely (returns 503).
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    res.status(503).json({ error: "Admin access is not configured on this server" });
    return;
  }

  const provided =
    (req.headers["x-admin-key"] as string | undefined) ||
    (req.query.adminKey as string | undefined);

  if (!provided || provided !== adminKey) {
    res.status(401).json({ error: "Unauthorized: invalid or missing admin key" });
    return;
  }

  next();
}
