import Link from "next/link";
import type { Article, CatalogCard, Service } from "@/lib/cms/client";
import { pickCatalogCardsBySlug } from "@/lib/cms/client";
import { EntityTabs, type EntityTab } from "@/components/catalog/entity-tabs";
import { JkShowcaseGrid } from "@/components/catalog/jk-showcase-grid";
import { RelatedPosts } from "@/components/blog/related-posts";
import {
  MortgageCalcWidget,
  LegalChecklistWidget,
  DefectsWidget,
  DesignStylesWidget,
  BeforeAfterWidget,
  YieldCalcWidget,
} from "./service-widgets";
import styles from "./service-page-body.module.css";

const TELEGRAM_URL = "https://t.me/Yana_Chekulova";

export function ServicePageBody({
  svc,
  tabs,
  catalogCards,
  rateText,
  posts,
}: {
  svc: Service;
  tabs: EntityTab[];
  catalogCards: CatalogCard[];
  rateText: string;
  posts: Article[];
}) {
  const jkCards = svc.featured_project_slugs?.length
    ? pickCatalogCardsBySlug(catalogCards, svc.featured_project_slugs)
    : [];

  return (
    <>
      <EntityTabs label="Услуга" tabs={tabs} active={svc.slug} />

      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumbs}>
            <Link href="/">Главная</Link>
            <span>/</span>
            <Link href="/uslugi">Услуги</Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>{svc.name}</span>
          </nav>
          <div className={styles.heroContent}>
            {svc.kicker ? <div className={styles.kicker}>{svc.kicker}</div> : null}
            <h1 className={styles.h1}>{svc.h1}</h1>
            {svc.pitch ? <p className={styles.pitch}>{svc.pitch}</p> : null}
            <div className={styles.heroActions}>
              <Link href="/quiz" className={`tpl-btn-prim ${styles.heroBtnPrim}`}>
                Подобрать под ключ
              </Link>
              <a href="#how" className={styles.heroBtnSec}>
                Как это работает
              </a>
            </div>
            <div className={styles.heroStats}>
              {(svc.hero_stats ?? []).map((s) => (
                <div className={styles.heroStat} key={s.label}>
                  <div className={styles.heroStatValue}>{s.text}</div>
                  <div className={styles.heroStatLabel}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how" className={styles.howSection}>
        <div className={styles.howGrid}>
          <div className={styles.howSticky}>
            <div className={styles.eyebrow}>Как это работает</div>
            <h2 className={styles.howTitle}>{svc.how_title}</h2>
            {svc.how_lead ? <p className={styles.howLead}>{svc.how_lead}</p> : null}
            {svc.how_badge ? (
              <div className={styles.howBadge}>
                <span className={styles.howBadgeDot} />
                {svc.how_badge}
              </div>
            ) : null}
          </div>
          <div className={styles.howList}>
            {(svc.steps ?? []).map((s) => (
              <div className={styles.howStep} key={s.n}>
                <div className={styles.howStepN}>{s.n}</div>
                <div className={styles.howStepBody}>
                  <div className={styles.howStepTitle}>{s.title}</div>
                  <div className={styles.howStepDesc}>{s.desc}</div>
                </div>
                <div className={styles.howStepFact}>{s.fact}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.trustSection}>
        <div className={styles.trustInner}>
          <div className={styles.trustHead}>
            <div>
              <div className={styles.eyebrow}>{svc.trust_kicker}</div>
              <h2 className={styles.trustTitle}>{svc.trust_title}</h2>
            </div>
            <div className={styles.trustNote}>{svc.trust_note}</div>
          </div>
          <div className={styles.trustGrid}>
            {(svc.trust_items ?? []).map((t) => (
              <div className={styles.trustCell} key={t.label}>
                <div className={styles.trustValue}>{t.v}</div>
                <div className={styles.trustLabel}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {svc.block === "calc" ? <MortgageCalcWidget /> : null}
      {svc.block === "checklist" ? <LegalChecklistWidget /> : null}
      {svc.block === "priemka" ? (
        <>
          <BeforeAfterWidget kind="priemka" kicker={svc.ba_kicker ?? "До и после устранения"} title={svc.ba_title ?? "Что застройщик исправил после нашего дефектного акта"} />
          <DefectsWidget />
        </>
      ) : null}
      {svc.block === "remont" ? (
        <>
          <BeforeAfterWidget kind="remont" kicker={svc.ba_kicker ?? "Галерея до / после"} title={svc.ba_title ?? "Квартиры от белых стен до заселения"} />
          <DesignStylesWidget />
        </>
      ) : null}
      {svc.block === "yield" ? <YieldCalcWidget /> : null}

      {svc.faq?.length ? (
        <section className={styles.faqSection}>
          <div className={styles.faqInner}>
            <div className={styles.eyebrow}>Частые вопросы</div>
            <h2 className={styles.faqTitle}>{svc.faq_title ?? `${svc.name}: частые вопросы`}</h2>
            <div className={styles.faqList}>
              {svc.faq.map((f) => (
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

      <section className={styles.jkSection}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.eyebrow}>Каталог под услугу</div>
            <h2 className={styles.sectionTitle}>{svc.catalog_title}</h2>
          </div>
          <Link href="/catalog" className={styles.allLink}>
            Все ЖК →
          </Link>
        </div>
        <JkShowcaseGrid cards={jkCards} rateText={rateText} />
      </section>

      <RelatedPosts eyebrow="Блог" title="Разбираем услугу подробно в статьях" posts={posts} />

      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <div className={styles.finalCtaEyebrow}>Первый шаг</div>
          <h2 className={styles.finalCtaTitle}>{svc.cta_title}</h2>
          {svc.cta_text ? <p className={styles.finalCtaLead}>{svc.cta_text}</p> : null}
          <div className={styles.finalCtaActions}>
            <Link href="/quiz" className={`tpl-btn-prim ${styles.finalCtaBtn}`}>
              Подобрать под ключ
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
