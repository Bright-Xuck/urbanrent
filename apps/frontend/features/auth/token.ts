import type { Role } from "../../api/types";
import type { User } from "../../Store/useUserStore";

const ROLES: ReadonlySet<string> = new Set(["TENANT", "LANDLORD", "ADMIN"]);

function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.has(value);
}

export function readUserFromAccessToken(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const claims: unknown = JSON.parse(atob(padded));

    if (typeof claims !== "object" || claims === null) return null;

    const userId = "userId" in claims ? claims.userId : undefined;
    const email = "email" in claims ? claims.email : undefined;
    const role = "role" in claims ? claims.role : undefined;

    if (typeof userId !== "string" || !isRole(role)) {
      return null;
    }

    return {
      id: userId,
      email: typeof email === "string" ? email : null,
      role,
    };
  } catch {
    return null;
  }
}
