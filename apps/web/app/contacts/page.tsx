import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema } from "@/lib/json-ld";
import {
  AGENT_NAME,
  AGENT_PHOTO,
  AGENT_PHOTO_SM,
  TELEGRAM_HANDLE,
  TELEGRAM_URL,
  MANAGER_NAME,
  MAX_DISPLAY,
  PHONE_DISPLAY,
  PHONE_TEL,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: `Контакты ${SITE_NAME} — риелтор по новостройкам в Екатеринбурге`,
  description: `Связаться с агентством ${SITE_NAME}: телефон ${PHONE_DISPLAY}, Telegram ${TELEGRAM_HANDLE}, MAX. Подбор новостроек в Екатеринбурге бесплатно для покупателя.`,
  alternates: { canonical: "/contacts" },
};

function contactSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}${AGENT_PHOTO}`,
    telephone: PHONE_TEL,
    areaServed: { "@type": "City", name: "Екатеринбург" },
    sameAs: [TELEGRAM_URL],
    founder: {
      "@type": "Person",
      name: AGENT_NAME,
      url: `${SITE_URL}/o-nas`,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: PHONE_TEL,
      contactType: "sales",
      areaServed: "RU",
      availableLanguage: "Russian",
    },
  };
}

export default function ContactsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={contactSchema()} />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "Контакты", path: "/contacts" },
        ])}
      />
      <SiteHeader />

      <div className={styles.wrap}>
        <div className={styles.crumbs}>
          <Link href="/">Главная</Link> / Контакты
        </div>

        <h1 className={styles.title}>Контакты</h1>
        <p className={styles.lead}>
          Работаем по новостройкам Екатеринбурга. Подбор, сопровождение сделки и заявки в банки —
          бесплатно для покупателя: комиссию платит застройщик.
        </p>

        <div className={styles.channels}>
          <a href={`tel:${PHONE_TEL}`} className={styles.channel}>
            <span className={styles.channelLabel}>Телефон</span>
            <span className={styles.channelValue}>{PHONE_DISPLAY}</span>
            <span className={styles.channelNote}>Звонок — самый быстрый способ</span>
          </a>

          <a href={TELEGRAM_URL} className={styles.channel}>
            <span className={styles.channelLabel}>Telegram</span>
            <span className={styles.channelValue}>{TELEGRAM_HANDLE}</span>
            <span className={styles.channelNote}>Скинем подборку прямо в чат</span>
          </a>

          <div className={styles.channel}>
            <span className={styles.channelLabel}>MAX</span>
            <span className={styles.channelValue}>{MAX_DISPLAY}</span>
            <span className={styles.channelNote}>Найдите по номеру телефона</span>
          </div>
        </div>

        <div className={styles.people}>
          <h2 className={styles.sectionTitle}>Кто ответит</h2>

          <Link href="/o-nas" className={styles.person}>
            <img
              src={AGENT_PHOTO_SM}
              alt={AGENT_NAME}
              width={56}
              height={56}
              className={styles.avatar}
            />
            <div>
              <p className={styles.personName}>{AGENT_NAME}</p>
              <p className={styles.personRole}>
                Сооснователь, риелтор по новостройкам. На рынке с 2019 года, более 100 сделок.
                Сертифицированный дизайнер интерьеров
              </p>
            </div>
          </Link>

          <div className={styles.person}>
            <div className={styles.avatarStub} aria-hidden="true">
              {MANAGER_NAME.charAt(0)}
            </div>
            <div>
              <p className={styles.personName}>{MANAGER_NAME}</p>
              <p className={styles.personRole}>
                Менеджер. Первый контакт, подбор объектов и запись на просмотры
              </p>
            </div>
          </div>
        </div>

        <div className={styles.meta}>
          <p>
            <b>Город работы:</b> Екатеринбург и ближайшие пригороды. Выезжаем на просмотры вместе с
            вами, встречу назначаем по адресу объекта.
          </p>
          <p>
            <b>Что взять на первый разговор:</b> примерный бюджет, есть ли первоначальный взнос и
            попадаете ли вы в льготную программу — семейную, IT или маткапитал. Этого хватит, чтобы
            сразу отсечь неподходящее.
          </p>
        </div>

        <div className={styles.ctaRow}>
          <a href={`tel:${PHONE_TEL}`} className="btn-prim">
            Позвонить
          </a>
          <Link href="/quiz" className="btn-sec">
            Пройти квиз за 2 минуты
          </Link>
          <Link href="/catalog" className="btn-sec">
            Смотреть каталог ЖК
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
