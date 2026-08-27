import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllArticleSlugs, getArticleBySlug, getArticles, pickRelatedArticles, strapiMediaUrl } from "@/lib/cms/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCover } from "@/components/blog/article-cover";
import { Prose } from "@/components/prose";
import { ViewTracker } from "@/components/blog/view-tracker";
import { CommentSection } from "@/components/blog/comment-section";
import { pageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { articleSchema, breadcrumbListSchema } from "@/lib/json-ld";
import styles from "./page.module.css";

export const revalidate = 3600;

interface RouteParams {
  slug: string;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return pageMetadata({
    title: article.seo_title ?? article.title,
    description: article.seo_description ?? article.excerpt ?? article.title,
    path: `/blog/${slug}`,
    image: article.cover ? strapiMediaUrl(article.cover) : undefined,
  });
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export default async function ArticlePage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const all = await getArticles();
  const keywords = [...(article.category?.split("·") ?? []), ...(article.tags ?? [])].map((k) => k.trim());
  const related = pickRelatedArticles(all, keywords, 3, slug);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Главная", path: "/" },
          { name: "Блог", path: "/blog" },
          { name: article.title, path: `/blog/${slug}` },
        ])}
      />
      <JsonLd data={articleSchema(article, `/blog/${slug}`)} />
      <SiteHeader active="blog" cta="quiz" />

      <article>
        <div className={styles.head}>
          <Link href="/blog" className={styles.back}>
            ← Все статьи
          </Link>
          {article.category ? <div className={styles.category}>{article.category}</div> : null}
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            <span className={styles.author}>{article.author_name}</span>
            <span>·</span>
            {article.author_role ? (
              <>
                <span>{article.author_role}</span>
                <span>·</span>
              </>
            ) : null}
            {article.read_minutes ? (
              <>
                <span>{article.read_minutes} мин</span>
                <span>·</span>
              </>
            ) : null}
            <span>{formatDate(article.published_date)}</span>
            <span>·</span>
            <span>{article.views ?? 0} просмотров</span>
          </div>
        </div>
        <ViewTracker articleDocumentId={article.documentId} />

        <div className={styles.heroWrap}>
          <div className={styles.hero}>
            <ArticleCover
              cover={article.cover}
              alt={article.title}
              fallbackLabel={article.category ?? article.title}
              sizes="(min-width: 1024px) 900px, 100vw"
            />
          </div>
        </div>

        <div className={styles.body}>
          <Prose content={article.content} className="prose" />
        </div>

        <div className={styles.inlineCtaWrap}>
          <div className={styles.inlineCta}>
            <div>
              <div className={styles.inlineCtaTitle}>Посчитаем ваш платёж бесплатно</div>
              <div className={styles.inlineCtaLead}>Без давления. Ответим в Telegram.</div>
            </div>
            <Link href="/quiz" className={`tpl-btn-prim ${styles.inlineCtaBtn}`}>
              Пройти квиз
            </Link>
          </div>
        </div>

        <CommentSection articleDocumentId={article.documentId} />
      </article>

      {related.length ? (
        <div className={styles.relatedWrap}>
          <div className={styles.relatedEyebrow}>Читайте также</div>
          <div className={styles.relatedGrid}>
            {related.map((p) => (
              <Link key={p.slug} data-post="" href={`/blog/${p.slug}`} className={styles.relatedCard}>
                <div className={styles.relatedPhoto}>
                  <ArticleCover
                    cover={p.cover}
                    alt={p.title}
                    fallbackLabel={p.category ?? "Статья"}
                    sizes="(min-width: 1024px) 380px, 90vw"
                  />
                </div>
                <div className={styles.relatedBody}>
                  {p.category ? <div className={styles.relatedCategory}>{p.category}</div> : null}
                  <div className={styles.relatedTitle}>{p.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <section className={styles.footerCtaSection}>
        <div className={styles.footerCtaInner}>
          <h2 className={styles.footerCtaTitle}>Подберём новостройку под ваш капитал — бесплатно</h2>
          <Link href="/quiz" className={`tpl-btn-prim ${styles.footerCtaBtn}`}>
            Начать подбор
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
