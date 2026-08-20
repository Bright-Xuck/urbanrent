import prisma from "../config/prisma.js";
import type { Role } from "../../generated/prisma/enums.js";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: Role;
}

export async function createUser(data: CreateUserInput) {
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
    },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

// ============================================================
// FIND USER BY ID
// ============================================================
// Used by the refresh token flow. When a refresh token comes in,
// we extract the userId from it, then load the full user record
// so we can issue a new access token with fresh user data.
// ============================================================
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}
