import prisma from "../config/prisma.js";
import { AccountState, Role } from "../../generated/prisma/enums.js";
import { unpublishAllPropertiesForOwner } from "./propertyRepository.js";

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

export interface UserFilters {
  role?: Role;
  accountState?: AccountState;
}

// ============================================================
// FIND ALL USERS (admin list - paginated + filtered)
// ============================================================
export async function findAllUsers(filters: UserFilters, offset: number, limit: number) {
  const where: { role?: Role; accountState?: AccountState } = {};
  if (filters.role) where.role = filters.role;
  if (filters.accountState) where.accountState = filters.accountState;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      // Never hand the password hash to the admin UI.
      select: {
        id: true,
        email: true,
        role: true,
        verificationState: true,
        accountState: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { users, total, offset, limit, totalPages };
}

// Flip a user's account state (used by suspend/reinstate).
export async function updateAccountState(userId: string, state: AccountState) {
  return prisma.user.update({
    where: { id: userId },
    data: { accountState: state },
  });
}

// Suspend a user and, when they are a landlord, pull all their
// PUBLISHED listings back to UNPUBLISHED - in ONE transaction.
// Either both writes land or neither does, so a suspension can
// never leave listings live under a suspended landlord.
export async function suspendUserWithCascade(userId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { accountState: AccountState.SUSPENDED },
    });

    if (user.role === Role.LANDLORD) {
      await unpublishAllPropertiesForOwner(userId, tx);
    }

    return user;
  });
}
