const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export interface LeadInput {
  name: string;
  phone: string;
  comment: string;
  sourcePath: string;
  sourceTitle: string;
  /** Honeypot field — must stay empty; bots that autofill every input trip it. */
  website: string;
  /** Ms between the form mounting and this submit — Strapi rejects anything under 1.2s. */
  elapsedMs: number;
  /** Present only for quiz submissions — the backend auto-tags lead_source: "quiz" when this is set. */
  quizAnswers?: Record<string, unknown>;
}

export type LeadResult = { ok: true } | { ok: false; message: string };

export async function submitLead(input: LeadInput): Promise<LeadResult> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          name: input.name,
          phone: input.phone,
          comment: input.comment || null,
          source_path: input.sourcePath,
          source_title: input.sourceTitle,
          ...(input.quizAnswers ? { quiz_answers: input.quizAnswers } : {}),
        },
        website: input.website,
        elapsed_ms: input.elapsedMs,
      }),
    });

    if (res.ok) return { ok: true };

    if (res.status === 429) {
      return { ok: false, message: "Слишком много попыток. Попробуйте через минуту." };
    }
    const body = await res.json().catch(() => null);
    const message: string | undefined = body?.error?.message;
    return { ok: false, message: message ?? "Не удалось отправить заявку. Попробуйте ещё раз." };
  } catch {
    return { ok: false, message: "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз." };
  }
}
