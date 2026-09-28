/**
 * Zod schemas for auth/profile forms. Rules mirror the backend DTOs
 * (HisaabSync/src/modules/auth/dtos/*) so users see errors before a round trip.
 */
import { z } from "zod";

/** Backend uses class-validator @IsPhoneNumber() with no region → needs +countrycode (E.164-ish). */
export const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

const email = z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email"));
const fullName = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters");
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");
const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || PHONE_REGEX.test(v.replace(/[\s-]/g, "")), {
    message: "Use international format, e.g. +919876543210",
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName,
    email,
    phone: optionalPhone,
    password: newPassword,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  fullName,
  phone: optionalPhone,
  profileImageUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || z.url({ protocol: /^https?$/ }).safeParse(v).success, {
      message: "Enter a valid http(s) URL",
    }),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword,
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current one",
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

/** Strip spaces/dashes users type into phone numbers. */
export function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, "");
}
