"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TagIcon, Trash2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCurrentRoom } from "@/components/rooms/room-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { TextField } from "@/components/shared/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useCategories, useCategoryMutations } from "@/hooks/use-expenses";
import { normalizeError } from "@/lib/api/errors";
import { applyApiErrorToForm } from "@/lib/forms";
import { categorySchema, type CategoryValues } from "@/schemas/expense";

/**
 * Expense categories. Everyone can see them; ADMIN/ACCOUNTANT can add; only ADMIN can delete,
 * and only categories no expense has ever used (the backend answers CATEGORY_IN_USE otherwise).
 */
export function CategoriesManager() {
  const { roomId, can, isArchived } = useCurrentRoom();
  const categories = useCategories(roomId);
  const { create, remove } = useCategoryMutations(roomId);

  const canCreate = can("categories.create") && !isArchived;
  const canDelete = can("categories.delete") && !isArchived;

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  function onSubmit({ name }: CategoryValues) {
    // Backend uniqueness is case-sensitive; catch "rent" vs "Rent" here for a cleaner list.
    const clash = categories.data?.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (clash) {
      form.setError("name", { message: `"${clash.name}" already exists` });
      return;
    }
    create.mutate(name, {
      onSuccess: (category) => {
        toast.success(`Category "${category.name}" added`);
        form.reset({ name: "" });
      },
      onError: (error) =>
        applyApiErrorToForm(error, form.setError, {
          fields: ["name"],
          codeToField: { CATEGORY_NAME_DUPLICATE: "name" },
        }),
    });
  }

  if (categories.isError) return <FormError message={normalizeError(categories.error).message} />;

  return (
    <div className="space-y-4">
      {canCreate && (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-2 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <TextField
              control={form.control}
              name="name"
              label="New category"
              placeholder="Internet"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="sm:mt-[1.625rem]" disabled={create.isPending}>
            {create.isPending ? <Spinner /> : <PlusIcon />}
            Add
          </Button>
        </form>
      )}
      <FormError message={form.formState.errors.root?.server?.message} />

      {categories.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : categories.data.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="No categories"
          description="Members need at least one category to log an expense."
          className="py-8"
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {categories.data.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <TagIcon className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">{category.name}</span>
                {category.isDefault && (
                  <Badge variant="secondary" className="font-normal">
                    Default
                  </Badge>
                )}
              </span>
              {canDelete && (
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2Icon />
                    </Button>
                  }
                  title={`Delete "${category.name}"?`}
                  description="Categories that are already used by an expense can't be deleted, to keep the history intact."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={() =>
                    remove.mutateAsync(category.id).then(() => {
                      toast.success(`Category "${category.name}" deleted`);
                    })
                  }
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
