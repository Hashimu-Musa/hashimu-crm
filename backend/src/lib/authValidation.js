import { z } from "zod";

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password must not exceed 128 characters");

export const registerSchema = z.object({
  organizationName: z.string().trim().min(2).max(120),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
  // Required only when the same email exists in more than one organization.
  organizationSlug: z.string().trim().min(1).max(120).optional(),
});
