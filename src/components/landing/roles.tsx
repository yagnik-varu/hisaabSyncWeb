import { RoleSwitcher } from "@/components/landing/role-switcher";
import { SectionHeading } from "@/components/landing/section-heading";

export function Roles() {
  return (
    <section
      id="roles"
      aria-labelledby="roles-title"
      className="bg-muted/30 scroll-mt-16 border-y py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="roles-title"
          eyebrow="Roles"
          title="Everyone can see. Not everyone can approve."
          description="Three simple roles keep the pool honest: members add and spend, accountants check, and admins run the room."
        />
        <RoleSwitcher />
        <p className="text-muted-foreground mx-auto mt-8 max-w-md text-center text-sm text-pretty">
          Roles are set per room, so you can be the admin of your flat and just a member on the Goa
          trip.
        </p>
      </div>
    </section>
  );
}
