import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** "Yagnik Varu" → "YV", "alice" → "A". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function UserAvatar({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name} referrerPolicy="no-referrer" />}
      <AvatarFallback className="text-xs font-medium">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
