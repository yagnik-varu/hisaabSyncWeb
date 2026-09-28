import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Mobile-first list used instead of tables for money records.
 * One layout for all widths: at phone width it reads like a banking app's transaction list,
 * on desktop it's a clean, scannable list with the amount column aligned on the right.
 */
export function ItemList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("bg-card divide-y overflow-hidden rounded-xl border", className)}>
      {children}
    </ul>
  );
}

/**
 *  [leading]  title ..................................... amount
 *             subtitle (status · date · who)                  aside
 *             children (note, rejection reason…)
 *             footer (actions — hidden automatically when empty)
 */
export function ItemRow({
  leading,
  title,
  subtitle,
  amount,
  aside,
  children,
  footer,
  onClick,
  className,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  amount?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Makes the whole row tappable (e.g. open a details sheet). */
  onClick?: () => void;
  className?: string;
}) {
  return (
    <li
      onClick={onClick}
      className={cn(
        "flex gap-3 px-4 py-3.5",
        onClick && "active:bg-muted/60 hover:bg-muted/30 cursor-pointer transition-colors",
        className,
      )}
    >
      {leading && <div className="shrink-0 pt-0.5">{leading}</div>}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 font-medium break-words">{title}</div>
          {amount && (
            <div className="shrink-0 text-right text-base font-semibold tabular-nums">{amount}</div>
          )}
        </div>
        {(subtitle || aside) && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
              {subtitle}
            </div>
            {aside && <div className="shrink-0">{aside}</div>}
          </div>
        )}
        {children}
        {footer && (
          // Stop row clicks when using the actions; hide when the actions render nothing.
          <div
            onClick={(e) => e.stopPropagation()}
            className="grid grid-cols-2 gap-2 pt-1.5 empty:hidden sm:flex sm:justify-end [&>*:only-child]:col-span-2"
          >
            {footer}
          </div>
        )}
      </div>
    </li>
  );
}

export function ItemListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ItemList>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex gap-3 px-4 py-3.5">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3.5 w-1/3" />
          </div>
        </li>
      ))}
    </ItemList>
  );
}

/** Round icon badge for list rows (credit/debit, receipts…). */
export function RowIcon({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "credit" | "debit";
}) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full [&_svg]:size-4",
        tone === "credit" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        tone === "debit" && "bg-red-500/10 text-red-600 dark:text-red-400",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
