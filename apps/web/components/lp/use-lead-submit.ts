"use client";

import { useCallback, useEffect, useRef } from "react";
import { submitLead, type LeadResult } from "@/lib/cms/leads";
import { GOALS, captureUtm, lpGoal } from "@/lib/analytics";
import { useLp } from "./lp-shell";

export type LpMessenger = "telegram" | "max" | "call";

interface SubmitArgs {
  name?: string;
  phone: string;
  messenger?: LpMessenger;
  /** Примечание клиента (форма /lp/podbory). */
  comment?: string;
  quizAnswers?: Record<string, unknown>;
  /** Honeypot: должно быть пустым. */
  website: string;
  /** Откуда заявка: modal, final или bubble — для цели Метрики. */
  place: "modal" | "final" | "bubble";
}

/** Отправка заявки с посадочной: путь, вариант, метки рекламы и антиспам — в одном месте. */
export function useLeadSubmit() {
  const { landing } = useLp();
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  return useCallback(
    async (args: SubmitArgs): Promise<LeadResult> => {
      const result = await submitLead({
        name: args.name?.trim() || undefined,
        phone: args.phone,
        comment: args.comment?.trim() ?? "",
        website: args.website,
        sourcePath: landing.path,
        sourceTitle: `Лендинг ${landing.label}`,
        elapsedMs: Date.now() - mountedAt.current,
        quizAnswers: args.quizAnswers,
        landing: landing.key,
        messenger: args.messenger,
        utm: captureUtm(),
      });
      if (result.ok) {
        lpGoal(GOALS.lpLead, landing.key, { messenger: args.messenger ?? "none", source: args.place });
      }
      return result;
    },
    [landing],
  );
}
