import { AuthGate } from "@/components/auth/guards";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserMenu } from "@/components/auth/user-menu";
import { RoomSwitcher } from "@/components/rooms/room-switcher";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/**
 * Shell for every signed-in page: logo, room switcher, notifications bell, theme toggle, user menu.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Logo href="/rooms" className="shrink-0" />
            <span className="text-muted-foreground/50 hidden sm:inline">/</span>
            <RoomSwitcher />
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6">
        <AuthGate>{children}</AuthGate>
      </main>
    </div>
  );
}
