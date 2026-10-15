"use client";

import type { CSSProperties, ReactNode } from "react";
import { useLeadModal } from "./lead-modal-provider";
import type { LeadVariant } from "./lead-modal";

const BUTTON_RESET: CSSProperties = {
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  appearance: "none",
  WebkitAppearance: "none",
};

/**
 * Кнопка «Подобрать квартиру» и её родственники: открывает форму заявки.
 * Стоит на месте прежних ссылок на /quiz — классы те же, вид не меняется.
 */
export function LeadCtaButton({
  className,
  style,
  children,
  variant = "podbor",
  onClick,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  variant?: LeadVariant;
  onClick?: () => void;
}) {
  const { open } = useLeadModal();
  return (
    <button
      type="button"
      className={className}
      style={{ ...BUTTON_RESET, ...style }}
      onClick={() => {
        onClick?.();
        open(variant);
      }}
    >
      {children}
    </button>
  );
}
