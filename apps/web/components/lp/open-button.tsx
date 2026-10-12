"use client";

import type { ReactNode } from "react";
import { useLp } from "./lp-shell";

export function OpenFormButton({
  className,
  block,
  children,
}: {
  className?: string;
  /** Блок страницы, откуда нажали: уходит параметром в цель lp_cta_click. */
  block: string;
  children: ReactNode;
}) {
  const { openForm } = useLp();
  return (
    <button type="button" className={className} onClick={() => openForm(block)}>
      {children}
    </button>
  );
}
