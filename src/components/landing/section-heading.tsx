import { cn } from "@/lib/utils";

/** Eyebrow + big title + optional intro, shared by every landing section. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  /** Put on the <h2> so the section can point at it with aria-labelledby. */
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{eyebrow}</p>
      <h2
        id={id}
        className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-4 text-base text-pretty sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
