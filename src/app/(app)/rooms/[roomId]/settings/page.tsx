"use client";

import { CategoriesManager } from "@/components/categories/categories-manager";
import { ArchiveRoomCard } from "@/components/rooms/archive-room-card";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { RoomSettingsForm } from "@/components/rooms/room-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Room settings: expense categories (admins + accountants) and, for admins only, room details and
 * the archive danger zone. Room details can't be edited once archived (backend guard).
 */
export default function RoomSettingsPage() {
  const { can, isArchived } = useCurrentRoom();
  const isAdmin = can("room.update");

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      {isAdmin && (
        <div className="space-y-6">
          {!isArchived && (
            <Card>
              <CardHeader>
                <CardTitle>Room details</CardTitle>
                <CardDescription>Only admins can change these.</CardDescription>
              </CardHeader>
              <CardContent>
                <RoomSettingsForm />
              </CardContent>
            </Card>
          )}
          <ArchiveRoomCard />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expense categories</CardTitle>
          <CardDescription>
            Used to group shared expenses. Admins and accountants can add categories; only admins
            can delete unused ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesManager />
        </CardContent>
      </Card>
    </div>
  );
}
