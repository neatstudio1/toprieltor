"use client";

import type { CSSProperties } from "react";
import { useLeadModal } from "./lead-modal-provider";

// Properties none of this button's callers ever set themselves via className
// or style — safe to hardcode without risk of clobbering caller styling.
const BUTTON_RESET: CSSProperties = {
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  appearance: "none",
  WebkitAppearance: "none",
};

export interface ViewingCtaButtonProps {
  className?: string;
  style?: CSSProperties;
  label?: string;
  onClick?: () => void;
}

export function ViewingCtaButton({ className, style, label = "Записаться на просмотр", onClick }: ViewingCtaButtonProps) {
  const { open } = useLeadModal();
  return (
    <button
      type="button"
      className={className}
      style={{ ...BUTTON_RESET, ...style }}
      onClick={() => {
        open();
        onClick?.();
      }}
    >
      {label}
    </button>
  );
}
