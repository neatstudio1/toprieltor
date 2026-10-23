"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LpModal } from "./lp-modal";
import { StickyBar } from "./sticky-bar";
import { GOALS, captureUtm, lpGoal } from "@/lib/analytics";
import type { LpMessenger } from "./use-lead-submit";
import s from "./lp.module.css";

export interface LandingMeta {
  key: string;
  label: string;
  path: string;
}

interface LpContextValue {
  landing: LandingMeta;
  /** `note` необязателен: форма /lp/podbory подставляет его в поле «Примечание», а `hiddenNote` уходит в заявку скрытой строкой. */
  openForm: (block: string, note?: string, hiddenNote?: string) => void;
  showThanks: (messenger?: LpMessenger) => void;
  closeForm: () => void;
}

export const LpContext = createContext<LpContextValue | null>(null);

export function useLp(): LpContextValue {
  const ctx = useContext(LpContext);
  if (!ctx) throw new Error("useLp must be used inside <LpShell>");
  return ctx;
}

const BAR_SCROLL_THRESHOLD = 640;

export function LpShell({
  children,
  landing,
}: {
  children: ReactNode;
  /** Подсказки для бывшего мини-квиза; квиз убран, проп оставлен до чистки страницы. */
  roomHints?: string[];
  landing: LandingMeta;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [formStep, setFormStep] = useState<"form" | "thanks">("form");
  const [thanksMessenger, setThanksMessenger] = useState<LpMessenger | undefined>(undefined);
  const [showBar, setShowBar] = useState(false);

  const landingKey = landing.key;
  const openForm = useCallback(
    (block: string) => {
      lpGoal(GOALS.lpCtaClick, landingKey, { block });
      setFormStep("form");
      setFormOpen(true);
    },
    [landingKey],
  );
  const showThanks = useCallback((messenger?: LpMessenger) => {
    setThanksMessenger(messenger);
    setFormStep("thanks");
    setFormOpen(true);
  }, []);

  // Метки из ссылки Директа запоминаем сразу, при первом заходе.
  useEffect(() => {
    captureUtm();
  }, []);
  const closeForm = useCallback(() => setFormOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = formOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [formOpen]);

  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFormOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formOpen]);

  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > BAR_SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const value = useMemo(
    () => ({ landing, openForm, showThanks, closeForm }),
    [landing, openForm, showThanks, closeForm],
  );

  return (
    <LpContext.Provider value={value}>
      {children}
      <div className={s.overlays}>
        <StickyBar visible={showBar && !formOpen} onOpen={() => openForm("sticky")} />
        {formOpen ? <LpModal step={formStep} messenger={thanksMessenger} onClose={closeForm} /> : null}
      </div>
    </LpContext.Provider>
  );
}
