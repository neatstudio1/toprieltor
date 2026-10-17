import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { LeadModalProvider } from "@/components/lead-modal/lead-modal-provider";
import { FloatingLeadButton } from "@/components/lead-modal/floating-lead-button";
// ID счётчика и цели живут в одном месте — lib/analytics.ts
import { YANDEX_METRIKA_ID } from "@/lib/analytics";
import "./globals.css";

/**
 * Шрифты — свои облегчённые файлы (2026-10-17), а не next/font/google.
 *
 * Google режет Inter на наборы символов: латиница 48 КБ, кириллица 19 КБ,
 * и знак «₽» попадает в «расширенную латиницу» — ради одного символа телефон
 * качал ещё 85 КБ. Для /lp отдельно грузилось начертание 800. Здесь один
 * вариативный файл 400–800 только с нужными символами: латиница, кириллица,
 * ₽, №, стрелки, тире — 33 КБ вместо ~180. Моноширинный — 14 КБ.
 * Пересобрать после новых символов в дизайне: fonttools varLib.instancer
 * (opsz=14, wght=400:800) → pyftsubset с --unicodes и --flavor=woff2.
 */
const inter = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-inter",
  weight: "400 800",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  variable: "--font-jetbrains-mono",
  weight: "400 600",
  display: "swap",
});

const DEFAULT_TITLE = "TOPиелтор — подбор новостроек Екатеринбурга";
const DEFAULT_DESCRIPTION =
  "Подбор квартир в новостройках Екатеринбурга с риелтором Яной Чекуловой. Каталог ЖК, ипотечный калькулятор, сопровождение сделки бесплатно.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: "%s" },
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
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}', 'ym');

            ym(${YANDEX_METRIKA_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
          `}
        </Script>
        <noscript>
          <div>
            {/* Пиксель Метрики для посетителей без JS — next/image тут не подходит. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
        <LeadModalProvider>
          {children}
          <FloatingLeadButton />
        </LeadModalProvider>
      </body>
    </html>
  );
}
