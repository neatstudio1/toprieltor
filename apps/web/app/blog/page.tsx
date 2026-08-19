import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/cms/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCover } from "@/components/blog/article-cover";
import { BlogFilters } from "@/components/blog/blog-filters";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbListSchema } from "@/lib/json-ld";
import styles from "./page.module.css";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Блог",
  description:
    "Ипотека, маткапитал, приёмка, инвестиции — коротко и по делу от команды TOPиелтор.",
  path: "/blog",
});

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export default async function BlogPage() {
  const articles = await getArticles();
  const featured = articles[0] ?? null;
  const rest = featured ? articles.filter((a) => a.slug !== featured.slug) : articles;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd data={breadcrumbListSchema([{ name: "Главная", path: "/" }, { name: "Блог", path: "/blog" }])} />
      <SiteHeader active="blog" />

      <div className={styles.head}>
        <div className={styles.eyebrow}>Блог · разбираемся в новостройках</div>
        <h1 className={styles.title}>Как купить квартиру грамотно — без переплат и ошибок</h1>
        <p className={styles.lead}>
          Ипотека, маткапитал, приёмка, инвестиции — коротко и по делу от нашей команды.
        </p>
      </div>

      {featured ? (
        <div className={styles.featuredWrap}>
          <Link data-feat="" href={`/blog/${featured.slug}`} className={styles.featured}>
            <div className={styles.featPhoto}>
              <ArticleCover
                cover={featured.cover}
                alt={featured.title}
                fallbackLabel={featured.category ?? "Разбор недели"}
                sizes="(min-width: 1024px) 600px, 100vw"
              />
              <div className={styles.featBadge}>Разбор недели</div>
            </div>
            <div className={styles.featBody}>
              {featured.category ? <div className={styles.featCategory}>{featured.category}</div> : null}
              <h2 className={styles.featTitle}>{featured.title}</h2>
              {featured.excerpt ? <p className={styles.featExcerpt}>{featured.excerpt}</p> : null}
              <div className={styles.featMeta}>
                <span>{featured.author_name}</span>
                <span>·</span>
                {featured.read_minutes ? (
                  <>
                    <span>{featured.read_minutes} мин</span>
                    <span>·</span>
                  </>
                ) : null}
                <span>{formatDate(featured.published_date)}</span>
              </div>
            </div>
          </Link>
        </div>
      ) : null}

      <BlogFilters articles={rest} />

      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div>
            <h2 className={styles.ctaTitle}>Разберём вашу ситуацию лично</h2>
            <p className={styles.ctaLead}>
              Пройдите квиз за 2 минуты — подскажем программу ипотеки и подберём новостройку под ваш капитал.
            </p>
          </div>
          <Link href="/quiz" className={`tpl-btn-prim ${styles.ctaBtn}`}>
            Пройти квиз
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
