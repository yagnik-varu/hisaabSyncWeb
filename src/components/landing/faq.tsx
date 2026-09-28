import { PlusIcon } from "lucide-react";

import { SectionHeading } from "@/components/landing/section-heading";

/** Answers reflect what the backend actually does today (docs/01, docs/02). Keep them honest. */
const FAQS = [
  {
    q: "Does HisaabSync move real money?",
    a: "No. You pay each other the way you already do — UPI, cash or a bank transfer. HisaabSync keeps the hisaab: who put money in, what was spent, and who has been paid back.",
  },
  {
    q: "How is this different from a bill-splitting app?",
    a: "Splitting apps track a debt between every pair of people. HisaabSync keeps one pool per room. You add money to the pool and get paid back from it, so you never have to chase one particular roommate.",
  },
  {
    q: "What happens when the pool runs low?",
    a: "In a strict room, a payback that would take the balance below zero is held until more money comes in. In a flexible room, the balance can go negative while someone fronts the cash.",
  },
  {
    q: "Can anyone change or delete old entries?",
    a: "No. Money records are never deleted — they only move through statuses like pending, approved or paid. If the balance needs correcting, an admin adds an adjustment, and it shows up on the ledger for everyone.",
  },
  {
    q: "How do people join my room?",
    a: "Share the room code. They enter it after signing up, and an admin approves the request before they can see anything in the room.",
  },
  {
    q: "Can I be in more than one room?",
    a: "Yes. Keep your flat, your hostel batch and your next trip in separate rooms, each with its own pool, currency and roles.",
  },
  {
    q: "What happens when someone moves out?",
    a: "They ask to leave and an admin approves it. Their history stays on the record, so the numbers still add up after they've gone.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <SectionHeading
          id="faq-title"
          align="left"
          eyebrow="FAQ"
          title="Questions, answered."
          description="The short version: HisaabSync keeps the room's books. You keep paying each other the usual way."
          className="lg:sticky lg:top-24 lg:self-start"
        />
        <div className="border-t">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border-b [&_summary::-webkit-details-marker]:hidden">
              <summary className="focus-visible:ring-ring/50 flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-left font-medium outline-none focus-visible:ring-3 sm:text-lg">
                {q}
                <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full transition-transform group-open:rotate-45">
                  <PlusIcon className="size-4" />
                </span>
              </summary>
              <p className="text-muted-foreground pr-12 pb-5 text-sm leading-relaxed text-pretty sm:text-base">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
