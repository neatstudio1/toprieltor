"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { GOALS, captureUtm, lpGoal } from "@/lib/analytics";
import { LpContext, type LandingMeta } from "../lp-shell";
import { StickyBar } from "../sticky-bar";
import { PodboryModal } from "./podbory-modal";
import s from "../lp.module.css";

const BAR_SCROLL_THRESHOLD = 640;

/**
 * Оболочка /lp/podbory. От общей отличается тем, что здесь нет квиз-пузыря,
 * а форма принимает примечание: карточка подборки и калькулятор подставляют
 * в него выбранную квартиру или расчёт.
 */
export function PodboryShell({
  children,
  landing,
  group,
}: {
  children: ReactNode;
  landing: LandingMeta;
  group: string;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [step, setStep] = useState<"form" | "thanks">("form");
  const [note, setNote] = useState("");
  const [hiddenNote, setHiddenNote] = useState("");
  const [showBar, setShowBar] = useState(false);
  const [finalVisible, setFinalVisible] = useState(false);

  const landingKey = landing.key;
  const openForm = useCallback(
    (block: string, prefill?: string, hidden?: string) => {
      lpGoal(GOALS.lpCtaClick, landingKey, { block, group });
      setNote(prefill ?? "");
      setHiddenNote(hidden ?? "");
      setStep("form");
      setFormOpen(true);
    },
    [landingKey, group],
  );
  const showThanks = useCallback(() => {
    setStep("thanks");
    setFormOpen(true);
  }, []);
  const closeForm = useCallback(() => setFormOpen(false), []);

  // Метки из ссылки Директа запоминаем сразу, при первом заходе.
  useEffect(() => {
    captureUtm();
  }, []);

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

  // Пока на экране финальная форма, липкая панель не нужна.
  useEffect(() => {
    const target = document.getElementById("podbory-final");
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setFinalVisible(entry.isIntersecting), {
      threshold: 0.15,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const value = useMemo(
    () => ({ landing, openForm, showThanks, closeForm }),
    [landing, openForm, showThanks, closeForm],
  );

  return (
    <LpContext.Provider value={value}>
      {children}
      <div className={s.overlays}>
        <StickyBar visible={showBar && !formOpen && !finalVisible} onOpen={() => openForm("sticky")} label="Оставить заявку" />
        {formOpen ? <PodboryModal step={step} note={note} hiddenNote={hiddenNote} onClose={closeForm} /> : null}
      </div>
    </LpContext.Provider>
  );
}
