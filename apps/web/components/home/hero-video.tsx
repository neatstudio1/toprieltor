import Image from "next/image";
import { DeferredVideo } from "@/components/deferred-video";

/**
 * Фон первого экрана: картинка сразу, видео поверх — потом и только на ПК.
 *
 * Раньше здесь был `<video poster preload="auto">` с первого байта: телефон
 * качал 1,4 МБ ролика, а LCP на мобильном был 7,9 с. Картинка идёт через
 * next/image с priority — телефон получает версию под свою ширину вместо
 * 190 КБ оригинала, и она же становится крупнейшим элементом экрана.
 * Ролик подключает DeferredVideo после загрузки страницы.
 */
export function HeroVideo({ className }: { className?: string }) {
  return (
    <>
      <Image src="/hero-poster.webp" alt="" fill priority sizes="100vw" className={className} />
      <DeferredVideo src="/hero.mp4" className={className} />
    </>
  );
}
