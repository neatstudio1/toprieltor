import type { Metadata } from "next";
import { getMortgageConfig } from "@/lib/cms/client";
import { QuizFlow } from "@/components/quiz/quiz-flow";
import { pageMetadata } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Подбор новостройки за 2 минуты",
  description: "Ответьте на несколько вопросов — подберём новостройки под ваш бюджет и капитал, посчитаем ориентировочный платёж.",
  path: "/quiz",
});

export default async function QuizPage() {
  const config = await getMortgageConfig();
  return <QuizFlow config={config} />;
}
