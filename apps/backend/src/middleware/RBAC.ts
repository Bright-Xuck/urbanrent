import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const { user } = req;
  if (user?.role !== "ADMIN") {
    res.status(501).json({ message: "not authorized" });
    return; // the return is to stop the code from executing is this condition is met
  }

  next();
}

export function requireLandordadmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { user } = req;
  if (user?.role !== "ADMIN" && user?.role !== "LANDLORD") {
    res.status(501).json({ message: "not authorized" });
    return; // the return is to stop the code from executing is this condition is met
  }

  next();
}
