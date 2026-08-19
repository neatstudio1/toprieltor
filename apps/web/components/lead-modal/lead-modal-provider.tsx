"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { LeadModal } from "./lead-modal";

interface LeadModalContextValue {
  open: () => void;
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
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <LeadModalContext.Provider value={{ open }}>
      {children}
      {isOpen ? <LeadModal onClose={close} /> : null}
    </LeadModalContext.Provider>
  );
}
