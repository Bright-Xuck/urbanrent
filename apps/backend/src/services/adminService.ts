import {
  findAllUsers,
  findUserById,
  updateAccountState,
  suspendUserWithCascade,
  type UserFilters,
} from "../repositories/userRepository.js";

// ADMIN SERVICE - user management: list / get / suspend / reinstate.

export async function listUsers(filters: UserFilters, offset: number, limit: number) {
  return findAllUsers(filters, offset, limit);
}

export async function getUserById(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found");
  return user;
}

export async function suspendUser(adminId: string, targetUserId: string) {
  if (adminId === targetUserId) {
    throw new Error("You cannot suspend your own account");
  }

  const user = await findUserById(targetUserId);
  if (!user) throw new Error("User not found");
  if (user.accountState === "SUSPENDED") {
    throw new Error("User is already suspended");
  }

  // For landlords this also unpublishes their listings (same transaction).
  return suspendUserWithCascade(targetUserId);
}

export async function reinstateUser(adminId: string, targetUserId: string) {
  if (adminId === targetUserId) {
    throw new Error("You cannot reinstate your own account");
  }

  const user = await findUserById(targetUserId);
  if (!user) throw new Error("User not found");
  if (user.accountState === "ACTIVE") {
    throw new Error("User is already active");
  }

  // Only the account state flips. Listings stay UNPUBLISHED on purpose -
  // the landlord must republish each one manually.
  return updateAccountState(targetUserId, "ACTIVE");
}
