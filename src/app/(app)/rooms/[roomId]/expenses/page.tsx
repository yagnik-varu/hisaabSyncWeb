import type { Metadata } from "next";
import { Suspense } from "react";

import { ExpensesView } from "@/components/expenses/expenses-view";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesView />
    </Suspense>
  );
}
