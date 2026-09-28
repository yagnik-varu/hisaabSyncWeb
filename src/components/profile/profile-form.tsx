"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { updateProfile, type UpdateProfileInput } from "@/lib/api/endpoints/auth";
import { updateSessionUser } from "@/lib/auth/session";
import { applyApiErrorToForm } from "@/lib/forms";
import { normalizePhone, profileSchema, type ProfileValues } from "@/schemas/auth";
import type { UserProfile } from "@/types/api";

function toFormValues(user: UserProfile): ProfileValues {
  return {
    fullName: user.fullName,
    phone: user.phone ?? "",
    profileImageUrl: user.profileImageUrl ?? "",
  };
}

export function ProfileForm({ user }: { user: UserProfile }) {
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(user),
  });
  const { errors, isDirty } = form.formState;
  // useWatch (not form.watch) so the React Compiler can still optimize this component.
  const [watchedName, imagePreview] = useWatch({
    control: form.control,
    name: ["fullName", "profileImageUrl"],
  });

  const mutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (updated) => {
      updateSessionUser(updated);
      form.reset(toFormValues({ ...user, ...updated }));
      toast.success("Profile updated");
    },
    onError: (error) => {
      applyApiErrorToForm(error, form.setError, {
        fields: ["fullName", "phone", "profileImageUrl"],
      });
    },
  });

  function onSubmit(values: ProfileValues) {
    // Empty optional fields are sent as null so the backend clears them ("" would fail validation).
    mutation.mutate({
      fullName: values.fullName,
      phone: values.phone ? normalizePhone(values.phone) : null,
      profileImageUrl: values.profileImageUrl || null,
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="flex items-center gap-4">
          <UserAvatar
            name={watchedName || user.fullName}
            imageUrl={imagePreview || null}
            className="size-16 text-lg"
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{user.email}</p>
            <p className="text-muted-foreground text-sm">Email can&apos;t be changed.</p>
          </div>
        </div>

        <FormError message={errors.root?.server?.message} />

        <TextField control={form.control} name="fullName" label="Full name" autoComplete="name" />
        <TextField
          control={form.control}
          name="phone"
          label="Phone"
          type="tel"
          placeholder="+919876543210"
          autoComplete="tel"
          description="Optional. International format with country code."
        />
        <TextField
          control={form.control}
          name="profileImageUrl"
          label="Profile image URL"
          type="url"
          placeholder="https://…"
          description="Optional. Image uploads aren't supported yet, so paste a link."
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || mutation.isPending}
            onClick={() => form.reset(toFormValues(user))}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!isDirty || mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Save changes
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
