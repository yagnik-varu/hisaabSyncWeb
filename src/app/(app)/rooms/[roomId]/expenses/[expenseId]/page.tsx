import type { Metadata } from "next";

import { ExpenseDetail } from "@/components/expenses/expense-detail";

export const metadata: Metadata = { title: "Expense" };

export default async function ExpenseDetailPage({
  params,
}: PageProps<"/rooms/[roomId]/expenses/[expenseId]">) {
  const { expenseId } = await params;
  return <ExpenseDetail expenseId={expenseId} />;
}
