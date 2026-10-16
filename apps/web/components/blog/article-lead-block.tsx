import Link from "next/link";
import type { CatalogCard } from "@/lib/cms/client";
import type { CatalogPick } from "@/lib/catalog-picks";
import type { LeadBlock } from "@/lib/article-blocks";
import { millionsRub, pickLabel, quotedName } from "@/lib/seo-templates";
import { pluralizeRu } from "@/lib/format";
import { TELEGRAM_URL } from "@/lib/site";
import { LeadCtaButton } from "@/components/lead-modal/lead-cta-button";
import styles from "./article-lead-block.module.css";

/** Блок заявки внутри статьи: кнопка открывает форму, у «Напишите Яне» — ссылка в Telegram. */
export function ArticleLeadBlock({ block }: { block: LeadBlock }) {
  return (
    <aside className={styles.block} data-lead-block={block.kind}>
      <div>
        <div className={styles.title}>{block.title}</div>
        <div className={styles.text}>{block.text}</div>
      </div>
      {block.kind === "telegram" ? (
        <a href={TELEGRAM_URL} className={styles.btn} target="_blank" rel="noopener noreferrer">
          {block.button}
        </a>
      ) : (
        <LeadCtaButton className={styles.btn}>{block.button}</LeadCtaButton>
      )}
    </aside>
  );
}

/**
 * «Квартиры по теме статьи»: ЖК, которые статья называет, и подборки каталога
 * по её району / комнатности. Статьи собирают трафик по длинным запросам,
 * а коммерческие страницы ссылок из них раньше не получали.
 */
export function ArticleCatalogLinks({ projects, picks }: { projects: CatalogCard[]; picks: CatalogPick[] }) {
  if (!projects.length && !picks.length) return null;
  return (
    <section className={styles.links}>
      <h2 className={styles.linksTitle}>Квартиры по теме статьи</h2>
      <div className={styles.linksGrid}>
        {projects.map((p) => (
          <Link key={p.slug} href={`/zhk/${p.slug}`} className={styles.link}>
            <span className={styles.linkName}>ЖК {quotedName(p.name)}</span>
            <span className={styles.linkMeta}>
              {p.priceFrom ? `от ${millionsRub(p.priceFrom)}` : "цены уточняются"}
              {p.developerName ? ` · ${p.developerName}` : ""}
            </span>
          </Link>
        ))}
        {picks.map((p) => (
          <Link key={p.path} href={p.path} className={styles.link}>
            <span className={styles.linkName}>{pickLabel(p)}</span>
            <span className={styles.linkMeta}>
              {p.count} {pluralizeRu(p.count, "вариант", "варианта", "вариантов")} · от {millionsRub(p.priceMin)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
