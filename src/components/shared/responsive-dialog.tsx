"use client";

import { createContext, useContext } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const MobileContext = createContext(false);

/**
 * Form container that is a **bottom sheet on phones** (thumb-reachable, drag to dismiss, handles
 * the on-screen keyboard) and a centered dialog on desktop.
 *
 * Layout contract for children:
 *   <ResponsiveDialog …>
 *     <form className="contents"> or any wrapper
 *       <ResponsiveDialogBody>fields…</ResponsiveDialogBody>      ← scrolls on phones
 *       <ResponsiveDialogFooter>buttons…</ResponsiveDialogFooter>  ← pinned at the bottom
 *     </form>
 *   </ResponsiveDialog>
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
  dismissible = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Desktop dialog width, e.g. "sm:max-w-lg". */
  className?: string;
  /** false while a request is running, so a swipe can't close it mid-save. */
  dismissible?: boolean;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileContext value>
        <Drawer open={open} onOpenChange={onOpenChange} dismissible={dismissible}>
          {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
          <DrawerContent className="max-h-[92dvh]">
            <DrawerHeader className="group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
              <DrawerTitle className="text-lg">{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
            {/* flex column so Body scrolls and Footer stays pinned */}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </DrawerContent>
        </Drawer>
      </MobileContext>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn("max-h-[90dvh] overflow-y-auto sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** Scrollable form body (phones); plain block on desktop. */
export function ResponsiveDialogBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const isMobile = useContext(MobileContext);
  return (
    <div
      className={cn(
        isMobile ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2" : "py-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Actions. Phones: full-width stacked buttons pinned to the bottom (primary last = closest to the
 * thumb), padded for the home indicator. Desktop: right-aligned row.
 * Put the secondary (Cancel) button FIRST in the DOM and the primary LAST.
 */
export function ResponsiveDialogFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const isMobile = useContext(MobileContext);
  return (
    <div
      className={cn(
        isMobile
          ? "bg-popover flex shrink-0 flex-col gap-2 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] [&>*]:w-full"
          : "flex flex-row justify-end gap-2 pt-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
