import { createUser, findUserByEmail } from "../repositories/userRepository.js";
import { Role } from "../../generated/prisma/enums.js";

export interface RegisterUserInput {
  email: string;
  password: string;
}

export async function registerUser(data: RegisterUserInput) {
  // Check if user already exists
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash the password (placeholder - should use bcrypt or similar)
  const passwordHash = data.password; // TODO: Replace with actual password hashing

  // Create the user via the repository with default TENANT role
  const user = await createUser({
    email: data.email,
    passwordHash,
    role: Role.TENANT,
  });

  return user;
}