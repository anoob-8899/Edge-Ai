import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .trim()
    .toLowerCase()
    .email("Please provide a valid optical practice email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  clinicId: z.string().optional().default("apex-optics-01"),
});

export const bootstrapOwnerSchema = z.object({
  email: z
    .string()
    .min(1, "Owner email is required")
    .trim()
    .toLowerCase()
    .email("Invalid email format for practice owner"),
  name: z
    .string()
    .min(2, "Owner name must be at least 2 characters")
    .max(80, "Name must not exceed 80 characters"),
  password: z
    .string()
    .min(8, "Owner password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  clinicId: z.string().optional().default("apex-optics-01"),
});

export const inviteStaffSchema = z.object({
  email: z
    .string()
    .min(1, "Staff email is required")
    .trim()
    .toLowerCase()
    .email("Please enter a valid staff email address"),
  name: z
    .string()
    .min(2, "Staff name must be at least 2 characters")
    .max(80, "Name must not exceed 80 characters"),
  password: z
    .string()
    .min(8, "Temporary password must be at least 8 characters"),
  clinicId: z.string().optional().default("apex-optics-01"),
  initialPrivateNote: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type BootstrapOwnerInput = z.infer<typeof bootstrapOwnerSchema>;
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
