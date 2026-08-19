import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { LeadModalProvider } from "@/components/lead-modal/lead-modal-provider";
import { QuizPopup } from "@/components/quiz/quiz-popup";
import { getMortgageConfig } from "@/lib/cms/client";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const DEFAULT_TITLE = "TOPиелтор — подбор новостроек Екатеринбурга";
const DEFAULT_DESCRIPTION =
  "Подбор квартир в новостройках Екатеринбурга с риелтором Яной Чекуловой. Каталог ЖК, ипотечный калькулятор, сопровождение сделки бесплатно.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [{ url: "/hero-poster.webp", width: 1920, height: 1080 }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/hero-poster.webp"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const mortgageConfig = await getMortgageConfig();
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <LeadModalProvider>{children}</LeadModalProvider>
        <QuizPopup config={mortgageConfig} />
      </body>
    </html>
  );
}
