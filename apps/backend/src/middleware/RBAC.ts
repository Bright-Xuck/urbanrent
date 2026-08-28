import type { Request, Response, NextFunction } from "express";

// Only a TENANT may access the route.
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const { user } = req;
  if (user?.role !== "TENANT") {
    res.status(403).json({ message: "not authorized" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const { user } = req;
  if (user?.role !== "ADMIN") {
    res.status(403).json({ message: "not authorized" });
    return;
  }
  next();
}

export function requireLandordadmin(req: Request, res: Response, next: NextFunction) {
  const { user } = req;
  if (user?.role !== "ADMIN" && user?.role !== "LANDLORD") {
    res.status(403).json({ message: "not authorized" });
    return;
  }
  next();
}
