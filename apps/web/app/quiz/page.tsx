import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { pageMetadata } from "@/lib/site";
import { QuizLeadPage } from "./lead-page";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Подберём новостройку в Екатеринбурге под ваш бюджет — заявка",
    description: "Подберём 3–5 новостроек Екатеринбурга под ваш бюджет с расчётом платежа. Для покупателя бесплатно — оставьте заявку.",
    path: "/quiz",
  }),
  // Страница для переходов из роликов: в поиске её роль выполняют главная и каталог.
  robots: { index: false, follow: true },
};

export default function QuizPage() {
  return (
    <>
      <SiteHeader />
      <QuizLeadPage />
      <SiteFooter />
    </>
  );
}
