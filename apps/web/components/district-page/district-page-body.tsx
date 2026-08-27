import Image from "next/image";
import Link from "next/link";
import type { Article, CatalogCard, District } from "@/lib/cms/client";
import { strapiMediaUrl, catalogCardsInDistrict } from "@/lib/cms/client";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { EntityTabs, type EntityTab } from "@/components/catalog/entity-tabs";
import { JkShowcaseGrid } from "@/components/catalog/jk-showcase-grid";
import { RelatedPosts } from "@/components/blog/related-posts";
import { INFRA_ICON_PATHS } from "./infra-icons";
import styles from "./district-page-body.module.css";

const TELEGRAM_URL = "https://t.me/Yana_Chekulova";

export function DistrictPageBody({
  d,
  tabs,
  catalogCards,
  rateText,
  posts,
  keyword,
}: {
  d: District;
  tabs: EntityTab[];
  catalogCards: CatalogCard[];
  rateText: string;
  posts: Article[];
  keyword: string;
}) {
  const jkCards = catalogCardsInDistrict(catalogCards, keyword);
  const heroPhotoUrl = d.hero_photo ? strapiMediaUrl(d.hero_photo) : jkCards.find((c) => c.photo)?.photo ?? null;

  return (
    <>
      <EntityTabs label="Район" tabs={tabs} active={d.slug} />

      <section className={styles.hero}>
        <nav className={styles.breadcrumbs}>
          <Link href="/">Главная</Link>
          <span>/</span>
          <Link href="/catalog">Каталог ЖК</Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{d.name}</span>
        </nav>
        <div className={styles.heroGrid}>
          <div>
            <div className={styles.eyebrow}>Район · Екатеринбург</div>
            <h1 className={styles.title}>{d.name}</h1>
            {d.lead ? <p className={styles.lead}>{d.lead}</p> : null}
            <div className={styles.traits}>
              {(d.traits ?? []).map((t) => (
                <div className={styles.traitRow} key={t.k}>
                  <span className={styles.traitK}>{t.k}</span>
                  <span className={styles.traitV}>{t.v}</span>
                </div>
              ))}
            </div>
            <div className={styles.heroActions}>
              <Link href="/quiz" className={`tpl-btn-prim ${styles.heroBtnPrim}`}>
                Подобрать квартиру в районе
              </Link>
              <a href="#jk" className={styles.heroBtnSec}>
                Смотреть ЖК
              </a>
            </div>
          </div>
          <div className={styles.heroPhoto}>
            {heroPhotoUrl ? (
              <Image src={heroPhotoUrl} alt={d.name} fill sizes="(min-width: 1024px) 560px, 100vw" style={{ objectFit: "cover" }} />
            ) : (
              <PhotoPlaceholder label={d.name} />
            )}
            {d.hero_caption ? <div className={styles.heroCaption}>{d.hero_caption}</div> : null}
          </div>
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {(d.stats ?? []).map((s) => (
            <div className={styles.statCell} key={s.label}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue}>{s.v}</div>
              <div className={styles.statNote}>{s.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="jk" className={styles.jkSection}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.eyebrow}>Новостройки района</div>
            <h2 className={styles.sectionTitle}>{d.jk_title ?? `Новостройки района «${d.name}»`}</h2>
          </div>
          <Link href="/catalog" className={styles.allLink}>
            Все ЖК →
          </Link>
        </div>
        <JkShowcaseGrid cards={jkCards} rateText={rateText} />
      </section>

      <section className={styles.infraSection}>
        <div className={styles.infraInner}>
          <div className={styles.infraHead}>
            <div>
              <div className={styles.infraEyebrow}>Инфраструктура</div>
              <h2 className={styles.infraTitle}>{d.infra_title}</h2>
            </div>
            <div className={styles.infraNote}>{d.infra_note}</div>
          </div>
          <div className={styles.infraGrid}>
            {(d.infra ?? []).map((i) => (
              <div className={styles.infraCard} key={i.title}>
                <span className={styles.infraIcon}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={INFRA_ICON_PATHS[i.icon] ?? INFRA_ICON_PATHS.mall} />
                  </svg>
                </span>
                <div className={styles.infraCount}>{i.count}</div>
                <div className={styles.infraCardTitle}>{i.title}</div>
                <div className={styles.infraDesc}>{i.desc}</div>
              </div>
            ))}
          </div>
          <div className={styles.infoTwoCol}>
            <div className={styles.infoCard}>
              <div className={styles.infoKicker}>Транспорт</div>
              {d.transport ? <p className={styles.infoText}>{d.transport}</p> : null}
              <div className={styles.infoRows}>
                {(d.routes ?? []).map((r) => (
                  <div className={styles.infoRow} key={r.k}>
                    <span className={styles.infoRowK}>{r.k}</span>
                    <span>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoKicker}>Экология</div>
              {d.ecology ? <p className={styles.infoText}>{d.ecology}</p> : null}
              <div className={styles.infoRows}>
                {(d.eco ?? []).map((r) => (
                  <div className={styles.infoRow} key={r.k}>
                    <span className={styles.infoRowK}>{r.k}</span>
                    <span>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {d.faq?.length ? (
        <section className={styles.faqSection}>
          <div className={styles.faqInner}>
            <div className={styles.eyebrow}>Частые вопросы</div>
            <h2 className={styles.faqTitle}>{d.faq_title ?? `${d.name}: частые вопросы`}</h2>
            <div className={styles.faqList}>
              {d.faq.map((f) => (
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

      <RelatedPosts title="Статьи про район и его новостройки" posts={posts} />

      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <div className={styles.finalCtaEyebrow}>Первый шаг</div>
          <h2 className={styles.finalCtaTitle}>{d.cta_title ?? `Подберём квартиру в районе «${d.name}»`}</h2>
          <p className={styles.finalCtaLead}>
            Пройдите квиз за 2 минуты — покажем объекты района под ваш бюджет, маткапитал и сроки заселения.
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
