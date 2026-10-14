import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

declare global {
  namespace Express { interface Request { userId?: string; authMode?: "demo" | "telegram" } }
}

/**
 * DEMO ONLY: maps a client-supplied header to a stable guest ID.
 * This is NOT authentication and is unsafe for public deployment.
 * Replace with a verified session/JWT auth flow before public launch.
 */
export function demoAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.ALLOW_DEMO_GUEST !== "true") {
    res.status(401).json({ error: "Authentication is not configured. Sign-in is required." });
    return;
  }
  const guestToken = String(req.header("x-demo-guest") || "");
  if (guestToken.length < 16 || guestToken.length > 100) {
    res.status(401).json({ error: "Create a demo guest session first." });
    return;
  }
  req.userId = crypto.createHash("sha256").update(guestToken).digest("hex");
  req.authMode = "demo";
  next();
}
