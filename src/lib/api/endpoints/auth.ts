/**
 * Auth endpoints that go DIRECTLY to NestJS with the Bearer token.
 * (login / register / google / refresh / logout go through the BFF — see lib/auth/session.ts.)
 */
import { api } from "@/lib/api/client";
import type { UserProfile } from "@/types/api";

/** GET /auth/me */
export function getMe(signal?: AbortSignal) {
  return api.get<UserProfile>("/auth/me", { signal });
}

export interface UpdateProfileInput {
  fullName?: string;
  /** null clears the phone (backend @IsOptional skips null; "" would fail @IsPhoneNumber). */
  phone?: string | null;
  profileImageUrl?: string | null;
}

/** PATCH /auth/profile — returns { id, fullName, email, phone, profileImageUrl }. */
export function updateProfile(input: UpdateProfileInput) {
  return api.patch<Pick<UserProfile, "id" | "fullName" | "email" | "phone" | "profileImageUrl">>(
    "/auth/profile",
    input,
  );
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/** PATCH /auth/change-password — AUTH_INVALID_CREDENTIALS (wrong current) / AUTH_NO_PASSWORD_SET (Google-only). */
export function changePassword(input: ChangePasswordInput) {
  return api.patch<unknown>("/auth/change-password", input);
}
