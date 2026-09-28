/**
 * The made-up room ("Flat 4B") used by every landing page illustration, so the demo phone, the
 * pool diagram and the orbit all show the same five flatmates. Colour classes are written out in
 * full so Tailwind can find them.
 */
export const FLATMATES = [
  { name: "Aarav", initials: "AM", bg: "bg-sky-600", stroke: "stroke-sky-600" },
  { name: "Priya", initials: "PS", bg: "bg-pink-600", stroke: "stroke-pink-600" },
  { name: "Meera", initials: "MI", bg: "bg-teal-600", stroke: "stroke-teal-600" },
  { name: "Rohan", initials: "RK", bg: "bg-violet-600", stroke: "stroke-violet-600" },
  { name: "Kabir", initials: "KS", bg: "bg-orange-600", stroke: "stroke-orange-600" },
] as const;

export type Flatmate = (typeof FLATMATES)[number];

export function flatmate(name: Flatmate["name"]): Flatmate {
  return FLATMATES.find((f) => f.name === name)!;
}
