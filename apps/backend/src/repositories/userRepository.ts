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