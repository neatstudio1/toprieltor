import Image from "next/image";
import Link from "next/link";
import type { Article, CatalogCard, Developer } from "@/lib/cms/client";
import { strapiMediaUrl, pickCatalogCardsBySlug } from "@/lib/cms/client";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { EntityTabs, type EntityTab } from "@/components/catalog/entity-tabs";
import { JkShowcaseGrid } from "@/components/catalog/jk-showcase-grid";
import { RelatedPosts } from "@/components/blog/related-posts";
import styles from "./developer-page-body.module.css";

const TELEGRAM_URL = "https://t.me/Yana_Chekulova";

const PARTNER_TERMS = [
  { title: "Бронь без наценки", desc: "Держим квартиру на брони, цена — как в отделе продаж застройщика." },
  { title: "Доступ к акциям", desc: "Видим закрытые скидки и субсидированные ставки раньше публичных." },
  { title: "Свой менеджер", desc: "Прямой контакт в отделе продаж: сроки, планировки, статус корпуса." },
  { title: "Сопровождение до ключей", desc: "Ипотека, юрист, приёмка — под одним координатором." },
];

const NON_PARTNER_TERMS = [
  { title: "Независимый подбор", desc: "Сравниваем застройщика с альтернативами без коммерческого интереса." },
  { title: "Юридическая проверка", desc: "Проверяем декларацию, эскроу и договор до подписания." },
  { title: "Помощь с ипотекой", desc: "Собираем заявку в 25+ банков независимо от застройщика." },
  { title: "Приёмка квартиры", desc: "Приедем на приёмку с приборами и чек-листом на 120+ пунктов." },
];

export function DeveloperPageBody({
  dev,
  tabs,
  catalogCards,
  rateText,
  posts,
}: {
  dev: Developer;
  tabs: EntityTab[];
  catalogCards: CatalogCard[];
  rateText: string;
  posts: Article[];
}) {
  const jkCards = dev.projects?.length
    ? pickCatalogCardsBySlug(catalogCards, dev.projects.map((p) => p.slug))
    : [];
  const bannerPhotoUrl = jkCards.find((c) => c.photo)?.photo ?? null;

  const isPartner = dev.is_partner !== false;
  const terms = isPartner ? PARTNER_TERMS : NON_PARTNER_TERMS;

  return (
    <>
      <EntityTabs label="Застройщик" tabs={tabs} active={dev.slug} />

      <section className={styles.hero}>
        <nav className={styles.breadcrumbs}>
          <Link href="/">Главная</Link>
          <span>/</span>
          <Link href="/catalog">Каталог ЖК</Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{dev.name}</span>
        </nav>
        {bannerPhotoUrl ? (
          <div className={styles.heroBanner}>
            <Image
              src={bannerPhotoUrl}
              alt={`Проект застройщика ${dev.name}`}
              fill
              sizes="(min-width: 1024px) 1216px, 100vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        ) : null}
        <div className={styles.heroTop}>
          <div className={styles.logo}>
            {dev.logo ? (
              <Image src={strapiMediaUrl(dev.logo)} alt={dev.name} fill sizes="96px" style={{ objectFit: "cover" }} />
            ) : (
              <PhotoPlaceholder label={dev.name} />
            )}
          </div>
          <div className={styles.heroMain}>
            <div className={styles.heroTopRow}>
              <div className={styles.eyebrow}>
                Застройщик{dev.city ? ` · ${dev.city}` : ""}
              </div>
              {isPartner ? (
                <span className={styles.partnerBadge}>
                  <span className={styles.partnerDot} />
                  Партнёр
                </span>
              ) : null}
            </div>
            <h1 className={styles.title}>{dev.name}</h1>
            {dev.lead ? <p className={styles.lead}>{dev.lead}</p> : null}
          </div>
        </div>
        <div className={styles.heroGrid}>
          <div className={styles.dossier}>
            {(dev.dossier ?? []).map((r) => (
              <div className={styles.dossierRow} key={r.k}>
                <span className={styles.dossierK}>{r.k}</span>
                <span className={styles.dossierV}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className={styles.noteCard}>
            <div className={styles.noteKicker}>Что важно знать</div>
            {dev.note ? <p className={styles.noteText}>{dev.note}</p> : null}
            <div className={styles.statsGrid}>
              {(dev.stats ?? []).map((s) => (
                <div className={styles.statCell} key={s.label}>
                  <div className={styles.statValue}>{s.v}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
            <Link href="/quiz" className={`tpl-btn-prim ${styles.noteCta}`}>
              Подобрать квартиру у застройщика
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.termsSection}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.eyebrow}>{isPartner ? "Наши партнёрские условия" : "Как мы работаем с этим застройщиком"}</div>
            <h2 className={styles.sectionTitle}>
              {isPartner
                ? "Застройщик — наш партнёр: бронь, акции и прямой менеджер"
                : "Партнёрского соглашения нет — работаем как независимый консультант"}
            </h2>
          </div>
          <div className={styles.sectionNote}>
            {isPartner
              ? "Комиссию платит застройщик. Для вас цена та же, что в его отделе продаж."
              : "Бронь и сделку оформляете напрямую, наши услуги по проверке и ипотеке остаются бесплатными."}
          </div>
        </div>
        <div className={styles.termsGrid}>
          {terms.map((t) => (
            <div className={styles.termCard} key={t.title}>
              <span className={styles.termIcon}>
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8.5 L6.5 12 L13 4.5" />
                </svg>
              </span>
              <div className={styles.termTitle}>{t.title}</div>
              <div className={styles.termDesc}>{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.jkSection}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.eyebrow}>Объекты застройщика</div>
            <h2 className={styles.sectionTitle}>Проекты {dev.name} в Екатеринбурге</h2>
          </div>
          <Link href="/catalog" className={styles.allLink}>
            Все ЖК →
          </Link>
        </div>
        <JkShowcaseGrid cards={jkCards} rateText={rateText} />
      </section>

      {dev.faq?.length ? (
        <section className={styles.faqSection}>
          <div className={styles.faqInner}>
            <div className={styles.eyebrow}>Частые вопросы</div>
            <h2 className={styles.faqTitle}>{dev.faq_title ?? `${dev.name}: частые вопросы`}</h2>
            <div className={styles.faqList}>
              {dev.faq.map((f) => (
                <details data-faq="" key={f.q} className={styles.faqItem}>
                  <summary className={styles.faqSummary}>
                    {f.q}
                    <span className={`tpl-plus ${styles.faqPlus}`}>
                      <span className={styles.faqPlusH} />
                      <span className={styles.faqPlusV} />
                    </span>
                  </summary>
                  <div className={styles.faqAnswer}>{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <RelatedPosts title="Статьи про застройщика и его проекты" posts={posts} />

      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <div className={styles.finalCtaEyebrow}>Первый шаг</div>
          <h2 className={styles.finalCtaTitle}>{dev.cta_title ?? `Подберём квартиру у ${dev.name}`}</h2>
          <p className={styles.finalCtaLead}>
            Пройдите квиз за 2 минуты — покажем объекты застройщика под ваш бюджет, сравним с альтернативами и
            проверим договор.
          </p>
          <div className={styles.finalCtaActions}>
            <Link href="/quiz" className={`tpl-btn-prim ${styles.finalCtaBtn}`}>
              Пройти квиз за 2 минуты
            </Link>
            <a href={TELEGRAM_URL} className={styles.finalCtaTg}>
              или напишите в Telegram @Yana_Chekulova
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
