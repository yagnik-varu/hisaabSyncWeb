/**
 * Title row for a room section. On phones it acts as the page title (the room header is hidden
 * there), so it's a bit larger and the description is dropped to save vertical space.
 */
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 md:items-end">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight md:text-lg">{title}</h2>
        {description && (
          <p className="text-muted-foreground hidden text-sm md:block">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
