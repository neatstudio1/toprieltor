"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { LeadModal, type LeadVariant } from "./lead-modal";

interface LeadModalContextValue {
  open: (variant?: LeadVariant) => void;
}

const LeadModalContext = createContext<LeadModalContextValue | null>(null);

export function useLeadModal(): LeadModalContextValue {
  const ctx = useContext(LeadModalContext);
  if (!ctx) {
    throw new Error("useLeadModal must be used within LeadModalProvider");
  }
  return ctx;
}

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<LeadVariant | null>(null);

  const open = useCallback((v: LeadVariant = "viewing") => setVariant(v), []);
  const close = useCallback(() => setVariant(null), []);

  return (
    <LeadModalContext.Provider value={{ open }}>
      {children}
      {variant ? <LeadModal variant={variant} onClose={close} /> : null}
    </LeadModalContext.Provider>
  );
}
