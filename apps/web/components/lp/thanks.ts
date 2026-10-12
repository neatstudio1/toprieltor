import type { LpMessenger } from "./use-lead-submit";

export const CONSENT_ERROR = "Отметьте согласие на обработку персональных данных";

/** Текст экрана «спасибо» зависит от того, где человек просил связаться. */
export function thanksLine(messenger?: LpMessenger): string {
  if (messenger === "call") return "Позвоню в течение 15 минут, с 9:00 до 21:00.";
  if (messenger === "telegram") return "Напишу в Telegram в течение 15 минут, с 9:00 до 21:00.";
  if (messenger === "max") return "Напишу в MAX в течение 15 минут, с 9:00 до 21:00.";
  return "Напишу в течение 15 минут, с 9:00 до 21:00.";
}
