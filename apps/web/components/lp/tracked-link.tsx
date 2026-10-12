"use client";

import type { ReactNode } from "react";
import { GOALS, lpGoal } from "@/lib/analytics";
import { useLp } from "./lp-shell";

/** Ссылка на телефон или Telegram с целью Метрики: видно, какие блоки страницы зовут писать. */
export function TrackedLink({
  href,
  kind,
  block,
  className,
  children,
}: {
  href: string;
  kind: "tg" | "phone";
  block: string;
  className?: string;
  children: ReactNode;
}) {
  const { landing } = useLp();
  return (
    <a
      href={href}
      className={className}
      onClick={() => lpGoal(kind === "tg" ? GOALS.lpTgClick : GOALS.lpPhoneClick, landing.key, { block })}
    >
      {children}
    </a>
  );
}
