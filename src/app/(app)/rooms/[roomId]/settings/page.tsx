"use client";

import { CategoriesManager } from "@/components/categories/categories-manager";
import { useCurrentRoom } from "@/components/rooms/room-context";
import { ComingSoon } from "@/components/shared/coming-soon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Room settings. Phase 5: expense categories. Phase 7 adds room details / archive (admin). */
export default function RoomSettingsPage() {
  const { can } = useCurrentRoom();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
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

      {can("room.update") && <ComingSoon title="Room details & archiving" phase={7} />}
    </div>
  );
}
